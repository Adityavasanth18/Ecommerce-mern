// frontend/src/components/FeaturedProducts.jsx
import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";

const FeaturedProducts = ({ featuredProducts }) => {
  const [index, setIndex] = useState(0);
  const [perPage, setPerPage] = useState(4);
  const { addToCart } = useCartStore();

  // derive end boundary once per render
  const endDisabled = useMemo(
    () => (featuredProducts?.length ?? 0) <= perPage || index >= (featuredProducts?.length ?? 0) - perPage,
    [featuredProducts, perPage, index]
  );
  const startDisabled = index === 0;

  // responsive items-per-page
  useEffect(() => {
    const computePerPage = () => {
      const w = window.innerWidth;
      if (w < 640) return 1;
      if (w < 1024) return 2;
      if (w < 1280) return 3;
      return 4;
    };

    const apply = () => {
      const next = computePerPage();
      setPerPage((prev) => {
        if (prev === next) return prev;
        // also clamp index so we never overshoot
        setIndex((i) => Math.max(0, Math.min(i, Math.max(0, (featuredProducts?.length ?? 0) - next))));
        return next;
      });
    };

    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [featuredProducts]);

  const next = () =>
    setIndex((i) => {
      const max = Math.max(0, (featuredProducts?.length ?? 0) - perPage);
      return Math.min(i + perPage, max);
    });

  const prev = () => setIndex((i) => Math.max(0, i - perPage));

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-5xl sm:text-6xl font-bold text-emerald-400 mb-4">Featured</h2>

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${index * (100 / perPage)}%)` }}
            >
              {featuredProducts?.map((product) => (
                <div key={product._id} className="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-2">
                  <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden h-full transition-all duration-300 hover:shadow-xl border border-emerald-500/30">
                    <div className="overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-48 object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2 text-white">{product.name}</h3>
                      <p className="text-emerald-300 font-medium mb-4">${product.price.toFixed(2)}</p>
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded transition-colors duration-300 flex items-center justify-center"
                        type="button"
                        aria-label={`Add ${product.name} to cart`}
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={prev}
            disabled={startDisabled}
            className={`absolute top-1/2 -left-4 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-300 ${
              startDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500"
            }`}
            type="button"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={next}
            disabled={endDisabled}
            className={`absolute top-1/2 -right-4 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-300 ${
              endDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500"
            }`}
            type="button"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProducts;
