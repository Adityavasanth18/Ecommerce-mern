// frontend/src/components/CartItem.jsx
import { Minus, Plus, Trash } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";

const CartItem = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCartStore();

  const dec = () => updateQuantity(item._id, item.quantity - 1);
  const inc = () => updateQuantity(item._id, item.quantity + 1);
  const remove = () => removeFromCart(item._id);

  return (
    <div className="rounded-lg border p-4 shadow-sm border-gray-700 bg-gray-800 md:p-6">
      <div className="space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0">
        {/* image */}
        <div className="shrink-0 md:order-1">
          <img
            className="h-20 md:h-32 rounded object-cover"
            src={item.image}
            alt={item.name}
          />
        </div>

        {/* qty + price */}
        <div className="flex items-center justify-between md:order-3 md:justify-end">
          <div className="flex items-center gap-2">
            <button
