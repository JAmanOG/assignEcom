import { prisma } from "../prismaClient.js";
import type { Request, Response } from "express";
import type { OrderStatus } from "../types/type.js";
import {
  adjustStock,
  returnStockFromOrder,
} from "./inventory_transactions.controller.js";

// Place order
const placeOrder = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { address_id, items, new_shipping_address } = req.body;

  if (
    (!address_id && !new_shipping_address) ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      message:
        "Either address_id or new_shipping_address and at least one item are required",
    });
  }

  try {
    let addressData;

    if (new_shipping_address) {
      // Use provided address object directly
      addressData = {
        ship_name: new_shipping_address.recipient_name,
        ship_phone: new_shipping_address.phone,
        ship_address: new_shipping_address.address,
        ship_city: new_shipping_address.city,
        ship_state: new_shipping_address.state,
        ship_zip: new_shipping_address.postal_code,
        notes: new_shipping_address.notes || null,
      };
    } else {
      // Fetch from saved Address book
      const address = await prisma.address.findUnique({
        where: { id: address_id },
      });
      if (!address || address.userId !== userId) {
        return res.status(404).json({ message: "Address not found" });
      }

      addressData = {
        ship_name: address.recipient_name,
        ship_phone: address.phone,
        ship_address: address.address,
        ship_city: address.city,
        ship_state: address.state,
        ship_zip: address.postal_code,
        notes: null,
      };
    }

    // Create a snapshot in Shipping_address
    const shippingAddress = await prisma.shipping_address.create({
      data: {
        user: { connect: { id: userId } },
        ...addressData,
      },
    });

    // Fetch products
    const productIds = items.map((i: any) => i.product_id);
    const products = await prisma.products.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Prepare order items & totals
    let subtotal = 0;
    const orderItemsData = items.map((item: any) => {
      const product = productMap.get(item.product_id);
      if (!product) throw new Error("Product not found: " + item.product_id);
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }

      const line_total = product.price * item.quantity;
      subtotal += line_total;
      return {
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: item.quantity,
        line_total,
      };
    });

    const shipping = 0;
    const total = subtotal + shipping;

    await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.orders.create({
        data: {
          userId,
          shipping_address_id: shippingAddress.id,
          items: { create: orderItemsData },
          shipping_amount: {
            create: {
              subtotal_amount: subtotal,
              shipping_amount: shipping,
              discount_amount: 0,
              total_amount: total,
            },
          },
        },
        include: { items: true, shipping_address: true, shipping_amount: true },
      });

      // Adjust stock for each product
      for (const item of orderItemsData) {
        await adjustStock(
          item.product_id,
          -item.quantity,
          `Order #${order.id} placed`,
          userId,
          tx as typeof prisma
        );
      }
      return res
        .status(201)
        .json({ message: "Order placed successfully", order });
    });
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// placing order through cart Id
const placeOrderFromCart = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const cartId = req.params.cartId;
  const { address_id, new_shipping_address } = req.body;

  if (!cartId || (!address_id && !new_shipping_address)) {
    return res.status(400).json({
      message: "Cart ID and either address_id or new_shipping_address are required",
    });
  }

  try {
    // Fetch user's cart
    const cart = await prisma.carts.findUnique({
      where: { id: cartId, userId },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ message: "Cart not found or empty" });
    }

    // Prepare order items & totals
    let subtotal = 0;
    const orderItemsData = cart.items.map((item) => {
      subtotal += item.total_price;
      return {
        product_id: item.productId,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        line_total: item.total_price,
      };
    });

    const shipping = 0; // Assuming no shipping cost for simplicity
    const total = subtotal + shipping;

    // Create shipping address
    let shippingAddress;
    if (new_shipping_address) {
      shippingAddress = await prisma.shipping_address.create({
        data: {
          userId,
          ship_name: new_shipping_address.recipient_name,
          ship_phone: new_shipping_address.phone,
          ship_address: new_shipping_address.address,
          ship_city: new_shipping_address.city,
          ship_state: new_shipping_address.state,
          ship_zip: new_shipping_address.postal_code,
          notes: new_shipping_address.notes || null,
        },
      });
    } else {
      const address = await prisma.address.findUnique({
        where: { id: address_id },
      });
      if (!address || address.userId !== userId) {
        return res.status(404).json({ message: "Address not found" });
      }
      shippingAddress = await prisma.shipping_address.create({
        data: {
          userId,
          ship_name: address.recipient_name,
          ship_phone: address.phone,
          ship_address: address.address,
          ship_city: address.city,
          ship_state: address.state,
          ship_zip: address.postal_code,
          notes: null,

        },
      });
    }
    // Create the order
    const order = await prisma.orders.create({
      data: {
        userId,
        shipping_address_id: shippingAddress.id,
        items: { create: orderItemsData },
        shipping_amount: {
          create: {
            subtotal_amount: subtotal,
            shipping_amount: shipping,
            discount_amount: 0,
            total_amount: total,
          },
        },
      },
      include: { items: true, shipping_address: true, shipping_amount: true },
    });

    // Adjust stock for each product
    for (const item of orderItemsData) {
      await adjustStock(
        item.product_id,
        -item.quantity,
        `Order #${order.id} placed from cart`,
        userId
      );
    }
    
    // Clear the cart after placing the order
    await prisma.carts.update({
      where: { id: cartId, userId },
      data: { items: { deleteMany: {} } },
    });

    return res
      .status(201)
      .json({ message: "Order placed successfully from cart", order });
  } catch (error) {
    console.error("Error placing order from cart:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}


// Get user's orders (Customer only)
const getUserOrders = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { page = "1", limit = "10", status } = req.query;

  // Validate userId
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Pagination params
    const pageNum = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * pageSize;
    const take = pageSize;

    const where: any = { userId };
    if (status) where.status = status;

    // Fetch orders for the user
    const orders = await prisma.orders.findMany({
      where,
      include: {
        items: true,
        shipping_address: true,
        delivery: { include: { delivery_partner: true } }, 
      },
      skip,
      take,
      orderBy: { placed_at: "desc" },
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching user's orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get order details by id
const getOrderDetails = async (req: Request, res: Response) => {
  const orderId = req.params.id;

  // Validate orderId
  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    // Check if order exists
    const orderExists = await prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!orderExists) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Fetch order details
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        shipping_address: true,
        delivery: { include: { delivery_partner: true } }, // <--- nested include
              },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all orders
const getAllOrders = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, status } = req.query;
  const pageNumber = parseInt(page as string);
  const limitNumber = parseInt(limit as string);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    const orders = await prisma.orders.findMany({
      skip: skip,
      take: limitNumber,
      where: status ? { status: status as OrderStatus } : {},
      include: {
        items: true,
        user: true,
        shipping_address: true,
        delivery: { include: { delivery_partner: true } },
      },
    });

    const totalOrders = await prisma.orders.count({
      where: status ? { status: status as OrderStatus } : {},
    });

    return res.status(200).json({
      message: "Orders fetched successfully",
      orders,
      totalOrders,
      page: pageNumber,
      limit: limitNumber,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update order status
const updateOrderStatus = async (req: Request, res: Response) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const OrderStatusValues = [
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  if (!orderId || !OrderStatusValues.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    // checking if order exists
    const orderExists = await prisma.orders.findUnique({
      where: { id: orderId },
    });
    if (!orderExists) {
      return res.status(404).json({ message: "Order not found" });
    }

    const idxtoUpdate = OrderStatusValues.indexOf(status);
    const idxOfCurrentStatus = OrderStatusValues.indexOf(orderExists.status);

    if (idxOfCurrentStatus > idxtoUpdate) {
      return res
        .status(400)
        .json({ message: "Cannot update to previous status" });
    }

    if (idxOfCurrentStatus === idxtoUpdate) {
      return res
        .status(400)
        .json({ message: "Order is already in this status" });
    }

    // Update order status
    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: true,
        user: true,
        shipping_address: true,
        delivery: { include: { delivery_partner: true } },
      },
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Assign order to delivery
const assignOrderToDelivery = async (req: Request, res: Response) => {
  const orderId = req.params.id;
  const { deliveryPartnerId } = req.body;

  console.log("Assigning order to delivery:", {
    orderId,
    deliveryPartnerId,
  });

  // Validate required fields
  if (!orderId || !deliveryPartnerId) {
    return res
      .status(400)
      .json({ message: "Order ID and delivery partner ID are required" });
  }

  try {
    // Check if order exists
    const orderExists = await prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!orderExists) {
      return res.status(404).json({ message: "Order not found" });
    }

    const deliveryPartnerExists = await prisma.user.findUnique({
      where: { id: deliveryPartnerId, role: "DELIVERY" },
    });
    if (!deliveryPartnerExists) {
      return res.status(404).json({
        message:
          "Delivery partner not found or Role with this ID not associated with it",
      });
    }

    // Assign delivery partner to the order
    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        delivery: {
          create: {
            delivery_partner_id: deliveryPartnerId,
            status: "ASSIGNED",
          },
        },
      },
      include: {
        items: true,
        user: true,
        shipping_address: true,
        delivery: { include: { delivery_partner: true } }, // added
      },
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Order assigned to delivery partner successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error assigning order to delivery:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete order
const deleteOrder = async (req: Request, res: Response) => {
  const orderId = req.params.id;

  // Validate orderId
  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    // Check if order exists
    const orderExists = await prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!orderExists) {
      return res.status(404).json({ message: "Order not found" });
    }

    await returnStockFromOrder(orderId, req.user?.id || "");
    // Delete the order
    await prisma.orders.delete({
      where: { id: orderId },
    });

    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//

export {
  placeOrder,
  getUserOrders,
  getOrderDetails,
  getAllOrders,
  updateOrderStatus,
  assignOrderToDelivery,
  deleteOrder,
  placeOrderFromCart
};
