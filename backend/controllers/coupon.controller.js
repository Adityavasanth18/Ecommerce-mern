// backend/controllers/coupon.controller.js
import Coupon from "../models/coupon.model.js";

const now = () => new Date();

const isExpired = (coupon) => coupon.expirationDate < now();

export const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    });

    // same behavior: return the document or null
    return res.json(coupon || null);
  } catch (error) {
    console.log("Error in getCoupon controller", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({
      code: code, // keep exact match semantics
      userId: req.user._id,
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (isExpired(coupon)) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(404).json({ message: "Coupon expired" });
    }

    return res.json({
      message: "Coupon is valid",
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (error) {
    console.log("Error in validateCoupon controller", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
