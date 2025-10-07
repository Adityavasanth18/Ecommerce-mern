// backend/lib/redis.js
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const { UPSTASH_REDIS_URL } = process.env;

if (!UPSTASH_REDIS_URL) {
  console.warn("⚠️  UPSTASH_REDIS_URL is not set. Redis will fail to connect.");
}

// single shared client instance
export const redis = new Redis(UPSTASH_REDIS_URL);

// optional visibility (no behavior change)
redis.on("ready", () => console.log("🔌 Redis ready"));
redis.on("error", (err) => console.log("❌ Redis error:", err?.message || err));
redis.on("reconnecting", () => console.log("… Redis reconnecting"));
