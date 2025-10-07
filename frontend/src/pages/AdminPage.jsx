// frontend/src/pages/AdminPage.jsx
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, PlusCircle, ShoppingBasket } from "lucide-react";

import AnalyticsTab from "../components/AnalyticsTab";
import CreateProductForm from "../components/CreateProductForm";
import ProductsList from "../components/ProductsList";
import { useProductStore } from "../stores/useProductStore";

const TABS = [
  { id: "create", label: "Create Product", icon: PlusCircle },
  { id: "products", label: "Products", icon: ShoppingBasket },
  { id: "analytics", label: "Analytics", icon: BarChart },
];

const AdminPage = () => {
  const [active, setActive] = useState("create");
  const { fetchAllProducts } = useProductStore();

  useEffect(() => {
    // kick off initial load for the products tab
    fetchAllProducts?.();
  }, [fetchAllProducts]);

  const ActivePanel = useMemo(() => {
    if (active === "products") return ProductsList;
    if (active === "analytics") return AnalyticsTab;
    return CreateProductForm; // default "create"
  }, [active]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 py-16">
        <motion.h1
          className="text-4xl font-bold mb-8 text-emerald-400 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Admin Dashboard
        </motion.h1>

        <div className="flex justify-center mb-8" role="tablist" aria-label="Admin sections">
          {TABS.map((tab) => {
            const isActive = active === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                className={`flex items-center px-4 py-2 mx-2 rounded-md transition-colors duration-200 ${
                  isActive ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <Icon className="mr-2 h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <section
              key={tab.id}
              id={`panel-${tab.id}`}
              role="tabpanel"
              hidden={!isActive}
              aria-labelledby={tab.id}
            >
              {isActive && <ActivePanel />}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPage;
