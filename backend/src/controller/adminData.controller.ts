import { prisma } from "../prismaClient.js";
import type { Request, Response } from "express";
import type { DeliveryStatus, OrderStatus } from "../types/type.js";

// total Ordered
const getTotalNoOfOrders = async (req: Request, res: Response) => {
  try {
    const totalOrders = await prisma.orders.count();
    return res.status(200).json({ totalOrders });
  } catch (error) {
    console.error("Error fetching total orders:", error);
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

// total pending deliveries
const getTotalPendingDeliveriesByStatus = async (
  req: Request,
  res: Response
) => {
  const { status } = req.query;
  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  try {
    const totalDeliveries = await prisma.delivery.count({
      where: { status: status as DeliveryStatus },
    });

    return res.status(200).json({ totalDeliveries });
  } catch (error) {
    console.error("Error fetching total deliveries by status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


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
    getTotalRevenue
};