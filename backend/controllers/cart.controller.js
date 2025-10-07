// backend/controllers/cart.controller.js
import Product from "../models/product.model.js";

// --- helpers (internal only; public API unchanged) ---

/**
 * Normalize user.cartItems into an array of { id: string, quantity: number }.
 * Accepts legacy shapes where items may be raw productIds.
 * Mutates user.cartItems in-memory to the normalized shape (saved by callers).
 */
function normalizeCartItems(user) {
  if (!Array.isArray(user.cartItems)) user.cartItems = [];

  user.cartItems = user.cartItems.map((entry) => {
    if (entry && typeof entry === "object") {
      // already { id, quantity }
      return {
        id: String(entry.id),
        quantity: Number(entry.quantity ?? 1),
      };
    }
    // legacy primitive ID
    return { id: String(entry), quantity: 1 };
  });

  return user.cartItems;
}

/** Build quick lookup maps for IDs and quantities */
function buildCartMaps(cartItems) {
  const qtyById = new Map(cartItems.map((it) => [it.id, it.quantity]));
  const ids = cartItems.map((it) => it.id);
  return { ids, qtyById };
}

// --- controllers (exports preserved) ---

export const getCartProducts = async (req, res) => {
  try {
    const user = req.user;
    const normalized = normalizeCartItems(user);
    const { ids, qtyById } = buildCartMaps(normalized);

    const products = await Product.find({ _id: { $in: ids } });

    // Return products with quantity merged (shape unchanged vs your current response)
    const cartItems = products.map((product) => {
      const quantity = qtyById.get(String(product.id)) ?? 0;
      return { ...product.toJSON(), quantity };
    });

    res.json(cartItems);
  } catch (error) {
    console.log("Error in getCartProducts controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    const cart = normalizeCartItems(user);
    const existing = cart.find((it) => it.id === String(productId));

    if (existing) {
      existing.quantity += 1;
    } else {
      // store in normalized shape (fixes prior push of raw id)
      cart.push({ id: String(productId), quantity: 1 });
    }

    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    console.log("Error in addToCart controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    const cart = normalizeCartItems(user);

    if (!productId) {
      user.cartItems = [];
    } else {
      user.cartItems = cart.filter((it) => it.id !== String(productId));
    }

    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    const cart = normalizeCartItems(user);
    const existing = cart.find((it) => it.id === String(productId));

    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (Number(quantity) === 0) {
      user.cartItems = cart.filter((it) => it.id !== String(productId));
      await user.save();
      return res.json(user.cartItems);
    }

    existing.quantity = Number(quantity);
    await user.save();
    res.json(user.cartItems);
  } catch (error) {
    console.log("Error in updateQuantity controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
