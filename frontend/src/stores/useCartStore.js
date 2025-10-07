// frontend/src/stores/useCartStore.js
import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const errMsg = (e, fallback) => e?.response?.data?.message || fallback;

export const useCartStore = create((set, get) => ({
  cart: [],
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,

  // ---- coupons ----
  getMyCoupon: async () => {
    try {
      const { data } = await axios.get("/coupons");
      set({ coupon: data || null });
    } catch (e) {
      console.error("Error fetching coupon:", e);
      // keep silent in UI; not a fatal path
    }
  },

  applyCoupon: async (code) => {
    try {
      const { data } = await axios.post("/coupons/validate", { code: String(code).trim() });
      set({ coupon: data, isCouponApplied: true });
      get().calculateTotals();
      toast.success("Coupon applied successfully");
    } catch (e) {
      toast.error(errMsg(e, "Failed to apply coupon"));
    }
  },

  removeCoupon: () => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed");
  },

  // ---- cart ----
  getCartItems: async () => {
    try {
      const { data } = await axios.get("/cart");
      set({ cart: Array.isArray(data) ? data : [] });
      get().calculateTotals();
    } catch (e) {
      set({ cart: [] });
      toast.error(errMsg(e, "An error occurred"));
    }
  },

  clearCart: () => {
    set({ cart: [], coupon: null, total: 0, subtotal: 0, isCouponApplied: false });
  },

  addToCart: async (product) => {
    try {
      await axios.post("/cart", { productId: product._id });
      toast.success("Product added to cart");

      set((state) => {
        const found = state.cart.find((i) => i._id === product._id);
        const cart = found
          ? state.cart.map((i) => (i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i))
          : [...state.cart, { ...product, quantity: 1 }];
        return { cart };
      });

      get().calculateTotals();
    } catch (e) {
      toast.error(errMsg(e, "An error occurred"));
    }
  },

  removeFromCart: async (productId) => {
    try {
      await axios.delete("/cart", { data: { productId } });
      set((state) => ({ cart: state.cart.filter((i) => i._id !== productId) }));
      get().calculateTotals();
    } catch (e) {
      toast.error(errMsg(e, "Failed to remove item"));
    }
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity === 0) {
      get().removeFromCart(productId);
      return;
    }

    try {
      await axios.put(`/cart/${productId}`, { quantity });
      set((state) => ({
        cart: state.cart.map((i) => (i._id === productId ? { ...i, quantity } : i)),
      }));
      get().calculateTotals();
    } catch (e) {
      toast.error(errMsg(e, "Failed to update quantity"));
    }
  },

  // ---- totals ----
  calculateTotals: () => {
    const { cart, coupon } = get();
    const subtotal = (cart || []).reduce((sum, i) => sum + (Number(i.price) || 0) * (i.quantity || 0), 0);

    let total = subtotal;
    if (coupon?.discountPercentage) {
      const discount = subtotal * (coupon.discountPercentage / 100);
      total = Math.max(0, subtotal - discount);
    }

    set({ subtotal, total });
  },
}));
