// backend/lib/db.js
import mongoose from "mongoose";

const { MONGO_URI } = process.env;

export const connectDB = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not set");
    }

    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✅ Mongo connected → ${conn.connection.host}`);
  } catch (err) {
    console.log("❌ Mongo connection error:", err.message);
    process.exit(1);
  }
};

// optional: tidy shutdown (doesn't change runtime behavior)
const closeOnSignal = async (signal) => {
  try {
    await mongoose.connection.close();
    console.log(`🛑 Mongo connection closed on ${signal}`);
  } catch (err) {
    console.log("Error closing Mongo connection:", err.message);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", () => closeOnSignal("SIGINT"));
process.on("SIGTERM", () => closeOnSignal("SIGTERM"));
