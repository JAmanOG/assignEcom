import { prisma } from "../index.js";
import type { Request, Response } from "express";

async function adjustStock(
  productId: string,
  delta: number,
  reason: string,
  userId: string,
  txClient?: typeof prisma 
) {
  const db = txClient || prisma;

  // Fetch current stock
  const product = await db.products.findUnique({
    where: { id: productId },
    select: { stock: true },
  });
  if (!product) throw new Error("Product not found");

  const newStock = product.stock + delta;
  if (newStock < 0) throw new Error("Insufficient stock");

  // Update stock
  await db.products.update({
    where: { id: productId },
    data: { stock: newStock },
  });

  // Log transaction
  await db.inventory_transactions.create({
    data: {
      product_id: productId,
      delta,
      reason,
      created_by: userId,
    },
  });

  return { productId, newStock };
}

const returnStockFromOrder = async (orderId: string, userId: string) => {
    await prisma.$transaction(async (tx) => {
      const orderItems = await tx.order_items.findMany({
        where: { order_id: orderId },
        select: { product_id: true, quantity: true },
      });
  
      for (const item of orderItems) {
        await adjustStock(
          item.product_id,
          item.quantity,
          `Order #${orderId} cancellation`,
          userId,
          tx as typeof prisma
        );
      }
    });
  };
  
  
  const restockProduct = async (req: Request, res: Response) => {
  const { productId, quantity, reason } = req.body;
  const userId = req.user?.id;

  if (quantity <= 0) {
    return res
      .status(400)
      .json({ message: "Quantity must be greater than zero" });
  }

  try {
    const result = await adjustStock(
      productId,
      quantity,
      reason || "Admin Restock",
      userId as string
    );
    res.status(200).json({ message: "Product restocked", data: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const reserveStockForOrder = async (req: Request, res: Response) => {
    const { items } = req.body;
    const userId = req.user?.id;
  
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items must be a non-empty array" });
    }
  
    try {
      const results = await prisma.$transaction(async (tx) => {
        const ops = [];
        for (const item of items) {
          ops.push(
            adjustStock(
              item.productId,
              -item.quantity,
              `Order Reservation - ${item.productId}`,
              userId as string,
              tx as typeof prisma
            )
          );
        }
        return Promise.all(ops);
      });
  
      res
        .status(200)
        .json({ message: "Stock reserved for order", data: results });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
  
export {
  restockProduct,
  reserveStockForOrder,
  returnStockFromOrder,
  adjustStock,
};
