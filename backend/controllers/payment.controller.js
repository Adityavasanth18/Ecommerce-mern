// backend/controllers/payment.controller.js
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";

// ---- internal helpers (implementation details only) ----
const toCents = (n) => Math.round(Number(n) * 100);
const toDollars = (cents) => cents / 100;

const buildLineItemsAndTotal = (products) => {
  let totalCents = 0;

  const lineItems = products.map((p) => {
    const unitAmount = toCents(p.price); // Stripe expects cents
    const qty = Number(p.quantity ?? 1);
    totalCents += unitAmount * qty;

    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: p.name,
          images: [p.image],
        },
        unit_amount: unitAmount,
      },
      quantity: qty,
    };
  });

  return { lineItems, totalCents };
};

async function createStripeCouponId(discountPercentage) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });
  return coupon.id;
}

async function issueNewUserCoupon(userId) {
  // single active coupon per user: remove previous
  await Coupon.findOneAndDelete({ userId });

  const newCoupon = new Coupon({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
    userId,
  });

  await newCoupon.save();
  return newCoupon;
}

// ---- controllers (exports preserved) ----

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    const { lineItems, totalCents: preDiscountTotal } = buildLineItemsAndTotal(products);

    // apply coupon (DB side) to total (not to Stripe line items—kept as in original)
    let appliedCoupon = null;
    let finalTotalCents = preDiscountTotal;

    if (couponCode) {
      appliedCoupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      if (appliedCoupon) {
        finalTotalCents -= Math.round((finalTotalCents * appliedCoupon.discountPercentage) / 100);
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: appliedCoupon
        ? [
            {
              coupon: await createStripeCouponId(appliedCoupon.discountPercentage),
            },
          ]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    // gift a new coupon if final total >= $200 (i.e., 20000 cents)
    if (finalTotalCents >= 20000) {
      await issueNewUserCoupon(req.user._id);
    }

    return res.status(200).json({ id: session.id, totalAmount: toDollars(finalTotalCents) });
  } catch (error) {
    console.error("Error processing checkout:", error);
    return res
      .status(500)
      .json({ message: "Error processing checkout", error: error.message });
  }
};

export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      // if a coupon was used, mark it inactive
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
          },
          { isActive: false }
        );
      }

      // create Order document
      const products = JSON.parse(session.metadata.products);
      const newOrder = new Order({
        user: session.metadata.userId,
        products: products.map((p) => ({
          product: p.id,
          quantity: p.quantity,
          price: p.price,
        })),
        totalAmount: toDollars(session.amount_total), // cents → dollars
        stripeSessionId: sessionId,
      });

      await newOrder.save();

      return res.status(200).json({
        success: true,
        message:
          "Payment successful, order created, and coupon deactivated if used.",
        orderId: newOrder._id,
      });
    }
    // (behavior preserved: no else branch altering status/message)
  } catch (error) {
    console.error("Error processing successful checkout:", error);
    return res.status(500).json({
      message: "Error processing successful checkout",
      error: error.message,
    });
  }
};
