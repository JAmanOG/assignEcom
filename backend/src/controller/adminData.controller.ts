import { prisma } from "../prismaClient.js";
import type { Request, Response } from "express";
import type { DeliveryStatus } from "../types/type.js";
import { OrderStatus } from "@prisma/client";


// total Ordered
const getTotalNoOfOrders = async (req: Request, res: Response) => {
  try {


    const totalOrders = await prisma.orders.count({
      where: {
        status: {
          in: [
            OrderStatus.PENDING,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.CANCELLED,
          ],
        },
      },
    });
    return res.status(200).json({ totalOrders });
  } catch (error) {
    console.error("Error fetching total orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Add /api/admin/users/total (active customers).
const getTotalActiveCustomers = async (req: Request, res: Response) => {
  try {
    const totalActiveCustomers = await prisma.user.count({
      where: { is_active: true },
    });

    return res.status(200).json({ totalActiveCustomers });
  } catch (error) {
    console.error("Error fetching total active customers:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Add /api/admin/orders/trend + /api/admin/revenue/trend (monthly stats).
const getMonthlyOrderTrend = async (req: Request, res: Response) => {
  try {
    const monthlyOrders = await prisma.$queryRaw<
      { month: Date; totalOrders: number }[]
    >`
      SELECT DATE_TRUNC('month', placed_at) AS month,
             COUNT(*)::int AS "totalOrders"
      FROM "Orders"
      WHERE status = 'DELIVERED'
      GROUP BY month
      ORDER BY month ASC;
    `;

    if (monthlyOrders.length === 0) {
      return res.status(200).json({
        message: "No orders found for the current year",
        monthlyOrders: [],
      });
    }

    return res.status(200).json(monthlyOrders);
  } catch (error) {
    console.error("Error fetching monthly order trend:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Add /api/admin/revenue/trend (monthly revenue stats).
const getMonthlyRevenueTrend = async (req: Request, res: Response) => {
  try {
    const monthlyRevenueTrend = await prisma.$queryRaw<
      { month: Date; totalRevenue: number }[]
    >`
      SELECT DATE_TRUNC('month', o."placed_at") AS month,
             SUM(sa."total_amount") AS "totalRevenue"
      FROM "Shipping_Amount" sa
      INNER JOIN "Orders" o ON o.id = sa."orderId"
      WHERE o.status = 'DELIVERED'
      GROUP BY month
      ORDER BY month ASC;
    `;

    return res.status(200).json(monthlyRevenueTrend);
  } catch (error) {
    console.error("Error fetching monthly revenue trend:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// Add /api/admin/sales/category (pie chart).
const getSalesByCategory = async (req: Request, res: Response) => {
  try {
    const salesByCategory = await prisma.$queryRaw<
      { category: string; revenue: number }[]
    >`
      SELECT c.name AS category,
             SUM(oi.line_total) AS revenue
      FROM "order_items" oi
      INNER JOIN "Products" p ON p.id = oi.product_id
      INNER JOIN "Categories" c ON c.id = p."categoryId"
      INNER JOIN "Orders" o ON o.id = oi.order_id
      WHERE o.status = 'DELIVERED'
      GROUP BY c.name
      ORDER BY revenue DESC;
    `;

    return res.status(200).json(salesByCategory);
  } catch (error) {
    console.error("Error fetching sales by category:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// total orders by status
const getTotalNoOfOrdersByStatus = async (req: Request, res: Response) => {
  const { status } = req.query;
  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  try {
    const totalOrders = await prisma.orders.count({
      where: { status: status as OrderStatus },
    });

    return res.status(200).json({ totalOrders });
  } catch (error) {
    console.error("Error fetching total orders by status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// model Delivery {
//   id                  String         @id @default(cuid())
//   order_id            String         @unique
//   delivery_partner_id String
//   status              DeliveryStatus @default(UNASSIGNED)
//   assigned_at         DateTime       @default(now())
//   last_update_at      DateTime       @updatedAt
//   notes               String?

//   // Relations
//   order            Orders @relation(fields: [order_id], references: [id], onDelete: Cascade)
//   delivery_partner User   @relation("DeliveryPartner", fields: [delivery_partner_id], references: [id], onDelete: Restrict)

//   @@index([delivery_partner_id])
// }


// total pending deliveries
const getTotalPendingDeliveriesByStatus = async (
  req: Request,
  res: Response
) => {
  const { status } = req.query;
  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  console.log("Total Deliveries");


  try {
    const totalDeliveries = await prisma.orders.count({
      where: { status: status as OrderStatus },
    });

    console.log("Total Deliveries:", totalDeliveries);

    return res.status(200).json({ totalDeliveries });
  } catch (error) {
    console.error("Error fetching total deliveries by status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Add /api/admin/products/top-selling.
const getTopSellingProducts = async (req: Request, res: Response) => {
  try {
    const topProducts = await prisma.$queryRaw<
      { productname: string; totalSold: number; revenue: number }[]
    >`
      SELECT p.name AS productname,
             SUM(oi.quantity)::int AS totalSold,
             SUM(oi.line_total) AS revenue
      FROM "order_items" oi
      INNER JOIN "Products" p ON p.id = oi.product_id
      INNER JOIN "Orders" o ON o.id = oi.order_id
      WHERE o.status = 'DELIVERED'
      GROUP BY p.name
      ORDER BY totalSold DESC
      LIMIT 10;
    `;

    return res.status(200).json(topProducts);
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Add /api/admin/performance/category (category revenue breakdown).
const getCategoryPerformance = async (req: Request, res: Response) => {
  try {
    const categoryPerformance = await prisma.$queryRaw<
      { category: string; totalRevenue: number }[]
    >`
      SELECT c.name AS category,
             SUM(oi.line_total) AS totalRevenue
      FROM "order_items" oi
      INNER JOIN "Products" p ON p.id = oi.product_id
      INNER JOIN "Categories" c ON c.id = p."categoryId"
      INNER JOIN "Orders" o ON o.id = oi.order_id
      WHERE o.status = 'DELIVERED'
      GROUP BY c.name
      ORDER BY totalRevenue DESC;
    `;

    return res.status(200).json(categoryPerformance);
  } catch (error) {
    console.error("Error fetching category performance:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Add /api/admin/orders/recent (recent orders) last 5 orders summary
const getRecentOrders = async (req: Request, res: Response) => {
  try {
    const recentOrders = await prisma.orders.findMany({
      orderBy: { placed_at: "desc" },
      take: 5,
      include: {
        items: true,
        user: true,
        shipping_address: true,
        delivery: { include: { delivery_partner: true } }, // Include delivery partner details
      },
    });

    return res.status(200).json(recentOrders);
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
} 

// total products
const getTotalProducts = async (req: Request, res: Response) => {
  try {
    const totalProducts = await prisma.products.count();
    return res.status(200).json({ totalProducts });
  } catch (error) {
    console.error("Error fetching total products:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// User Growth based on month and current year with total no of {month delivery_partner , customer}
const getUserGrowth = async (req: Request, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();
    const getUserCustomer = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        created_at: {
          gte: new Date(`${currentYear}-01-01`),
          lt: new Date(`${currentYear + 1}-01-01`),
        },
      },
      select: {
        created_at: true,
        role: true,
      },
    });
    const getUserDeliveryPartner = await prisma.user.findMany({
      where: {
        role: "DELIVERY",
        created_at: {
          gte: new Date(`${currentYear}-01-01`),
          lt: new Date(`${currentYear + 1}-01-01`),
        },
      },
      select: {
        created_at: true,
        role: true,
      },
    });

    const allUserGrowth = [...getUserCustomer, ...getUserDeliveryPartner];

    type GrowthEntry = { month: number; delivery: number; customers: number };
    const userGrowth = allUserGrowth.reduce<Record<number, GrowthEntry>>((acc, user) => {
      const month: number = user.created_at.getMonth() + 1;
      if (!acc[month]) {
        acc[month] = { month, delivery: 0, customers: 0 };
      }
      if (user.role === "DELIVERY") {
        acc[month].delivery += 1;
      } else if (user.role === "CUSTOMER") {
        acc[month].customers += 1;
      }
      return acc;
    }, {});

    const formattedGrowth = Object.values(userGrowth);
    return res.status(200).json(formattedGrowth);
  } catch (error) {
    console.error("Error fetching user growth:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}


// get Total Revenue
const getTotalRevenue = async (req: Request, res: Response) => {
    try {
      const totalRevenue = await prisma.shipping_Amount.aggregate({
        _sum: {
          total_amount: true,
        },
        where: {
          order: {
            status: "DELIVERED" as OrderStatus,
          },
        },
      });
  
      return res.status(200).json({
        totalRevenue: totalRevenue._sum.total_amount || 0,
      });
    } catch (error) {
      console.error("Error fetching total revenue:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

export {
  getTotalNoOfOrders,
    getTotalNoOfOrdersByStatus,
    getTotalPendingDeliveriesByStatus,
    getTotalRevenue,
    getRecentOrders,
    getTotalActiveCustomers,
    getMonthlyOrderTrend,
    getMonthlyRevenueTrend,
    getSalesByCategory,
    getTopSellingProducts,
    getCategoryPerformance,
    getUserGrowth,
    getTotalProducts
};