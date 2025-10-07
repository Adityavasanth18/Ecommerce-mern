// frontend/src/components/GiftCouponCard.jsx
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";

const GiftCouponCard = () => {
  const [code, setCode] = useState("");
  const { coupon, isCouponApplied, applyCoupon, getMyCoupon, removeCoupon } = useCartStore();

  // fetch user's coupon on mount
  useEffect(() => {
    getMyCoupon();
  }, [getMyCoupon]);

  // keep input in sync when a coupon exists
  useEffect(() => {
    if (coupon) setCode(coupon.code);
  }, [coupon]);

  const handleApply = useCallback(() => {
    const trimmed = code.trim();
    if (!trimmed) return;
    applyCoupon(trimmed);
  }, [code, applyCoupon]);

  const handleRemove = useCallback(async () => {
    await removeCoupon();
    setCode("");
  }, [removeCoupon]);

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply();
    }
  };

  return (
    <motion.div
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="voucher" className="mb-2 block text-sm font-medium text-gray-300">
            Do you have a voucher or gift card?
          </label>
          <input
            type="text"
            id="voucher"
            className="block w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5 text-sm text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
            placeholder="Enter code here"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={onKeyDown}
            required
          />
        </div>

        <motion.button
          type="button"
          className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleApply}
          disabled={!code.trim()}
          aria-label="Apply coupon code"
        >
          Apply Code
        </motion.button>
      </div>

      {isCouponApplied && coupon && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-300">Applied Coupon</h3>
          <p className="mt-2 text-sm text-gray-400">
            {coupon.code} - {coupon.discountPercentage}% off
          </p>

          <motion.button
            type="button"
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRemove}
            aria-label="Remove applied coupon"
          >
            Remove Coupon
          </motion.button>
        </div>
      )}

      {coupon && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-300">Your Available Coupon:</h3>
          <p className="mt-2 text-sm text-gray-400">
            {coupon.code} - {coupon.discountPercentage}% off
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default GiftCouponCard;
