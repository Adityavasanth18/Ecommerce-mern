// backend/controllers/product.controller.js
import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";

// ---- constants / helpers (internal only) ----
const FEATURED_CACHE_KEY = "featured_products";

const publicIdFromUrl = (url) => {
  // expects something like ".../products/<publicId>.jpg"
  try {
    const last = url.split("/").pop();          // "<publicId>.ext"
    const base = last.split(".")[0];            // "<publicId>"
    return `products/${base}`;
  } catch {
    return null;
  }
};

async function refreshFeaturedCache() {
  try {
    // lean() returns plain JS objects (faster, smaller)
    const docs = await Product.find({ isFeatured: true }).lean();
    await redis.set(FEATURED_CACHE_KEY, JSON.stringify(docs));
  } catch (err) {
    console.log("Error refreshing featured cache:", err?.message || err);
  }
}

// ---- controllers (public contract preserved) ----

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}); // same behavior
    return res.json({ products });
  } catch (error) {
    console.log("Error in getAllProducts controller", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    // try cache first
    let cached = await redis.get(FEATURED_CACHE_KEY);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // fetch from DB if cache miss
    const featured = await Product.find({ isFeatured: true }).lean();

    if (!featured) {
      return res.status(404).json({ message: "No featured products found" });
    }

    await redis.set(FEATURED_CACHE_KEY, JSON.stringify(featured));
    return res.json(featured);
  } catch (error) {
    console.log("Error in getFeaturedProducts controller", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;

    let uploaded = null;
    if (image) {
      uploaded = await cloudinary.uploader.upload(image, { folder: "products" });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: uploaded?.secure_url || "",
      category,
    });

    // no behavior change for response
    return res.status(201).json(product);
  } catch (error) {
    console.log("Error in createProduct controller", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // best-effort image cleanup (same external behavior)
    if (product.image) {
      const publicId = publicIdFromUrl(product.image);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
          console.log("Deleted image from Cloudinary");
        } catch (err) {
          console.log("Error deleting image from Cloudinary", err);
        }
      }
    }

    await Product.findByIdAndDelete(id);

    // keep cache fresh if we removed a featured product (no API change)
    if (product.isFeatured) {
      await refreshFeaturedCache();
    }

    return res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("Error in deleteProduct controller", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $sample: { size: 4 } },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);

    return res.json(products);
  } catch (error) {
    console.log("Error in getRecommendedProducts controller", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const products = await Product.find({ category });
    return res.json({ products });
  } catch (error) {
    console.log("Error in getProductsByCategory controller", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isFeatured = !product.isFeatured;
    const updated = await product.save();

    await refreshFeaturedCache();

    return res.json(updated);
  } catch (error) {
    console.log("Error in toggleFeaturedProduct controller", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
