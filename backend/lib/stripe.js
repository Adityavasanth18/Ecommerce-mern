// backend/lib/stripe.js
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const { STRIPE_SECRET_KEY } = process.env;

if (!STRIPE_SECRET_KEY) {
  console.warn("⚠️  STRIPE_SECRET_KEY is not set. Stripe client will not work.");
}

// Keep config minimal to avoid behavior changes
export const stripe = new Stripe(STRIPE_SECRET_KEY);
