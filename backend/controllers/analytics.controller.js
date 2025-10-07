// backend/controllers/analytics.controller.js
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

/**
 * Returns overall analytics: user count, product count, total orders, total revenue.
 * Public contract unchanged.
 */
export const getAnalyticsData = async () => {
  // Run independent counts/aggregation in parallel
  const [userCount, productCount, salesAgg] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.aggregate([
      {
        $group: {
          _id: null, // group all orders
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ])
  ]);

  const { totalSales, totalRevenue } =
    salesAgg[0] ?? { totalSales: 0, totalRevenue: 0 };

  return {
    users: userCount,
    products: productCount,
    totalSales,
    totalRevenue
  };
};

/**
 * Daily sales/revenue between startDate and endDate (inclusive).
 * Returns [{ date: 'YYYY-MM-DD', sales: number, revenue: number }, ...]
 * Public contract unchanged.
 */
export const getDailySalesData = async (startDate, endDate) => {
  try {
    const from = new Date(startDate);
    const to = new Date(endDate);

    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: from,
            $lte: to
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const grouped = await Order.aggregate(pipeline);

    // Build a quick lookup map: dateStr -> { sales, revenue }
    const byDate = new Map(grouped.map((d) => [d._id, { sales: d.sales, revenue: d.revenue }]));

    // Ensure every date in range appears (fill gaps with zeroes)
    return enumerateDates(from, to).map((dateStr) => {
      const found = byDate.get(dateStr);
      return {
        date: dateStr,
        sales: found?.sales ?? 0,
        revenue: found?.revenue ?? 0
      };
    });
  } catch (err) {
    // keep original throw behavior
    throw err;
  }
};

/** Helper: inclusive date range as 'YYYY-MM-DD' strings (UTC-based). */
function enumerateDates(start, end) {
  const out = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    out.push(cursor.toISOString().split("T")[0]); // 'YYYY-MM-DD'
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}
