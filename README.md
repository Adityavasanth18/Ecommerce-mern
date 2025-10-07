# MERN E‑Commerce

A full‑stack e‑commerce application built with MongoDB, Express, React, and Node.js. It includes secure authentication with httpOnly cookies, product management and images, a server‑backed cart with coupons, Stripe checkout, Redis caching for speed, and an admin dashboard with sales analytics.

## Features

- Authentication: signup, login, logout, access and refresh tokens stored in httpOnly cookies.
- Products: categories, featured products, image uploads.
- Shopping Cart: server‑persisted cart, quantity controls, order totals.
- Coupons: per‑user, validation, percentage discounts, expiry handling.
- Payments: Stripe Checkout Sessions; order creation after successful payment.
- Orders: stored with user reference, items, quantities, and totals.
- Admin Dashboard: create/delete products, toggle featured, KPI counters, daily sales and revenue chart.
- Caching: featured products cached in Redis for fast home page loads.
- Modern UI: React + Vite, Tailwind CSS, Framer Motion, Zustand, Recharts.

## Tech Stack

Frontend
- React 18 with Vite
- Tailwind CSS
- Zustand for state management
- Axios for HTTP
- Framer Motion for animations
- Recharts for charts

Backend
- Node.js + Express
- MongoDB + Mongoose
- JSON Web Tokens
- Redis (Upstash or standard Redis)
- Cloudinary for image hosting
- Stripe for payments

## Project Structure

```
.
├── backend/
│   ├── controllers/
│   │   ├── analytics.controller.js
│   │   ├── auth.controller.js
│   │   ├── cart.controller.js
│   │   ├── coupon.controller.js
│   │   ├── payment.controller.js
│   │   └── product.controller.js
│   ├── lib/
│   │   ├── cloudinary.js
│   │   ├── db.js
│   │   ├── redis.js
│   │   └── stripe.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/            # user, product, order, coupon
│   ├── routes/            # /auth, /products, /cart, /coupons, /payments, /analytics
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/        # useUserStore, useCartStore, useProductStore
│   │   ├── lib/axios.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
├── package.json
└── README.md
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```
# Server
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Frontend origin (used for redirects and CORS)
CLIENT_URL=http://localhost:5173

# Redis (Upstash or standard Redis URL)
UPSTASH_REDIS_URL=your_redis_url

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
```

No additional `.env` is required inside `frontend/` unless custom Vite variables are introduced.

## Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   npm install --prefix frontend
   ```

2. Ensure MongoDB, Redis, Cloudinary, and Stripe credentials are available in `.env`.

## Development

Run backend and frontend in separate terminals:

```bash
# Backend (at repo root)
npm run dev

# Frontend
cd frontend
npm run dev
```

- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:5173`

## Production

Build and run from the repository root:

```bash
npm run build
npm start
```

The build script installs frontend dependencies and produces the production build.

## API Summary

Authentication
- POST    /auth/signup
- POST    /auth/login
- POST    /auth/logout
- POST    /auth/refresh-token
- GET     /auth/profile

Products
- GET     /products
- GET     /products/featured
- GET     /products/category/:category
- POST    /products            (admin)
- DELETE  /products/:id        (admin)
- PATCH   /products/:id        (toggle featured, admin)

Cart
- GET     /cart
- POST    /cart                { productId }
- PUT     /cart/:id            { quantity }
- DELETE  /cart                { productId? }  # no productId → clear all

Coupons
- GET     /coupons             # user’s active coupon
- POST    /coupons/validate    { code }

Payments
- POST    /payments/create-checkout-session
- POST    /payments/checkout-success          { sessionId }

Analytics (admin)
- GET     /analytics

## Security Notes

- Access and refresh tokens are sent as httpOnly cookies. Client-side code cannot read them.
- CORS must allow credentials and the frontend origin specified by `CLIENT_URL`.
- Use strong values for token secrets. Rotate credentials periodically.
- Validate and sanitize all inputs on the server.

## Troubleshooting

- Authentication not working locally:
  - Ensure Axios is configured with `withCredentials: true`.
  - Confirm `CLIENT_URL` matches the actual frontend origin.

- Stripe not redirecting or confirming:
  - Use a valid publishable key on the frontend when initializing Stripe.
  - Confirm the secret key is correct in `.env`.

- Images not showing:
  - Verify Cloudinary credentials and that uploads are succeeding on the server.

- Redis unavailable:
  - The app can run without Redis; caching of featured products will be skipped.

## Roadmap

- Order history for users
- Product reviews and ratings
- Stock tracking and inventory alerts
- Admin CSV export for sales
