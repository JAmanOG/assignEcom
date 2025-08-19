import { prisma } from "../prismaClient.js";
import type { Request, Response } from "express";
import type { OrderStatus } from "../types/type.js";
import {
  adjustStock,
  returnStockFromOrder,
} from "./inventory_transactions.controller.js";
import Razorpay from "razorpay";
import * as crypto from "crypto";

const razorpayClient = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

const paise = (num: number) => Math.round(num * 100);

const genReceipt = (orderId: string) => {
  const shortId = orderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12); // compact
  const ts = Date.now().toString(36); // shorter than decimal
  let receipt = `rc_${shortId}_${ts}`; // usually < 30 chars
  if (receipt.length > 40) receipt = receipt.slice(0, 40);
  return receipt;
};


// Place order COD this is 
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

const paymentPlaceOrder = async (req: Request, res: Response) => {
  console.log("Placing the payment order")
  const userId = req.user?.id;
  const { address_id, cartId, currency = "INR",new_shipping_address } = req.body;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!cartId) return res.status(400).json({ message: "Cart ID is required" });

  try {
    // Use findFirst so we can check userId as well
    const cart = await prisma.carts.findFirst({
      where: { id: cartId, userId },
      include: { items: { include: { product: true } }, user: true },
    });

    if (!cart) return res.status(404).json({ error: "Cart not found" });
    if (!cart.items || cart.items.length === 0) return res.status(400).json({ error: "Cart is empty" });

    let shippingAddressId: string;
    if (new_shipping_address) {
      const created = await prisma.shipping_address.create({
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
      shippingAddressId = created.id;
    } else {
      const addr = await prisma.address.findUnique({ where: { id: address_id } });
      if (!addr || addr.userId !== userId) {
        return res.status(404).json({ message: "Address not found" });
      }
      const created = await prisma.shipping_address.create({
        data: {
          userId,
          ship_name: addr.recipient_name,
          ship_phone: addr.phone,
          ship_address: addr.address,
          ship_city: addr.city,
          ship_state: addr.state,
          ship_zip: addr.postal_code,
          notes: null,
        },
      });
      shippingAddressId = created.id;
    }


    const subtotalFloat = cart.items.reduce((s, it) => s + Number(it.total_price), 0);
    const shippingAmount = subtotalFloat > 100 ? 0 : 9.99;
    const tax = subtotalFloat * 0.08;
    const totalFloat = subtotalFloat + shippingAmount + tax;
    const totalPaise = paise(totalFloat);

    // Create Order server-side (PENDING, UNPAID)
    const newOrder = await prisma.orders.create({
      data: {
        userId: cart.userId,
        status: "PENDING",
        payment_status: "UNPAID",
        shipping_address_id: shippingAddressId,
        items: {
          create: cart.items.map((i) => ({
            product_id: i.productId,
            product_name: i.product_name,
            unit_price: i.unit_price,
            quantity: i.quantity,
            line_total: i.total_price,
          })),
        },
        shipping_amount: {
          create: {
            subtotal_amount: subtotalFloat,
            shipping_amount: shippingAmount,
            discount_amount: 0,
            total_amount: totalFloat,
          },
        },
      },
      include: { items: true, shipping_amount: true },
    });

    // Create payments row locally
    let receipt = genReceipt(newOrder.id);
    if (process.env.NODE_ENV !== "production" && receipt.length > 40) {
      console.warn("Receipt still >40 after generation (will be trimmed):", receipt);
      receipt = receipt.slice(0, 40);
    }

    const paymentRecord = await prisma.payments.create({
      data: {
        orderId: newOrder.id,
        cartId,
        provider: "RAZORPAY",
        receipt,
        amount: totalPaise,
        currency: "INR",
        status: "CREATED",
        metadata: { cartId },
      },
    });

    // Create Razorpay order
    let razorpayOrder;
    try {
      razorpayOrder = await razorpayClient.orders.create({
        amount: totalPaise,
        currency,
        receipt,
        notes: { orderId: newOrder.id, paymentId: paymentRecord.id },
      });
    } catch (err: any) {
      // mark payment failed and return error
      await prisma.payments.update({
        where: { id: paymentRecord.id },
        data: { status: "FAILED", metadata: { err: err?.message || String(err) } },
      });
      console.error("Razorpay order creation failed:", err);
      return res.status(500).json({ message: "Failed to create payment order", detail: err?.message || String(err) });
    }

    await prisma.payments.update({
      where: { id: paymentRecord.id },
      data: { provider_order_id: razorpayOrder.id },
    });

    return res.json({ razorpayOrder, localOrderId: newOrder.id, paymentId: paymentRecord.id });
  } catch (err: any) {
    console.error("create order error", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
};

// --- Validate order (client posted signature) ---
const validateOrder = async (req: Request, res: Response) => {
  console.log("entered ValidateOrder")
  const userId = req.user?.id;
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, paymentId, localOrderId,cartId } = req.body;

  console.log(req.body)

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    console.log("missing field error ")
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    // idempotency: ensure payment record exists and not already captured
    const paymentRec = await prisma.payments.findUnique({ where: { id: paymentId } });
    if (!paymentRec){ console.log("Payment record not found")
       return res.status(404).json({ error: "Payment record not found" })};
    if (paymentRec.status === "CAPTURED") {
      return res.json({ ok: true, message: "Payment already captured", orderId: localOrderId, paymentId: paymentRec.id });
    }

    // verify signature
    const generated = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    generated.update(`${razorpay_order_id}|${razorpay_payment_id}`)
    const digest = generated.digest("hex");
    if (digest !== razorpay_signature) {
      console.log("Invalid signature")
      return res.status(400).json({ error: "Invalid signature" });
    }

    // (Optional) fetch payment from Razorpay server-side to confirm
    const fetched = await razorpayClient.payments.fetch(razorpay_payment_id);


    if (fetched.status !== "captured") {
      console.log("Payment not captured")
      return res.status(400).json({ error: "Payment not captured" });
    }

    console.log("Reached here before transaction")
    // Update payment & order; then decrement stock + inventory transactions in an idempotent way
    await prisma.$transaction(async (tx) => {
      await tx.payments.update({
        where: { id: paymentId },
        data: { provider_payment_id: razorpay_payment_id, status: "CAPTURED", metadata: { verifiedBy: "client-handler", verifiedAt: new Date().toISOString() } },
      });

      await tx.orders.update({
        where: { id: localOrderId },
        data: { payment_status: "PAID", status: "CONFIRMED" },
      });

      // Fetch order items and decrement stock (idempotency: check inventory transaction/logging to avoid double decrement)
      const order = await tx.orders.findUnique({ where: { id: localOrderId }, include: { items: true } });
      if (order && order.items?.length) {
        for (const item of order.items) {
          // adjustStock expects the prisma tx when you want to be in same transaction
          await adjustStock(item.product_id, -item.quantity, `Order #${localOrderId} paid`, userId || "", tx as typeof prisma);
        }
        if(cartId){
          const whereClause: any = { id: cartId };
          if (userId) whereClause.userId = userId;
          await prisma.carts.update({
            where: whereClause,
            data: { items: { deleteMany: {} } },
          });
        }
      }
    });

    return res.json({ ok: true, orderId: localOrderId, paymentId });
  } catch (err: any) {
    console.error("validate error", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
};

// --- Webhook handler (authoritative) ---
const webhookHandler = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    if (!signature) return res.status(400).send("Missing signature");

    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    // req.body here must be raw body (Buffer/string). Many setups set it as Buffer in req.body
    const raw = (req as any).rawBody ?? JSON.stringify(req.body);
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (expected !== signature) {
      console.warn("Webhook signature mismatch");
      return res.status(400).send("Invalid signature");
    }

    const event = req.body;
    // handle payment.captured / payment.authorized
    if (event?.event === "payment.captured" || event?.event === "payment.authorized") {
      const payload = event.payload?.payment?.entity;
      const razorpayPaymentId = payload?.id;
      const razorpayOrderId = payload?.order_id;
      const amount = payload?.amount;

      const p = await prisma.payments.findFirst({ where: { provider_order_id: razorpayOrderId } });
      if (!p) {
        console.warn("No local payment record for", razorpayOrderId);
        return res.status(200).send("ok");
      }

      if (p.status === "CAPTURED") {
        return res.status(200).send("already handled");
      }

      await prisma.$transaction(async (tx) => {
        await tx.payments.update({ where: { id: p.id }, data: { provider_payment_id: razorpayPaymentId, status: "CAPTURED", metadata: { webhook: event } } });
        if (p.orderId) {
          await tx.orders.update({ where: { id: p.orderId }, data: { payment_status: "PAID", status: "CONFIRMED" } });

          // decrement stock (idempotency: ensure adjustStock handles duplicates or check inventory logs)
          const order = await tx.orders.findUnique({ where: { id: p.orderId }, include: { items: true } });
          if (order?.items?.length) {
            for (const item of order.items) {
              await adjustStock(item.product_id, -item.quantity, `Order #${p.orderId} paid (webhook)`, p?.cartId || "");
            }
          }
        }
      });
    }

    return res.status(200).send("ok");
  } catch (err: any) {
    console.error("webhook handler err", err);
    return res.status(500).send("error");
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
      message:
        "Cart ID and either address_id or new_shipping_address are required",
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
};

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
    "CONFIRMED",
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
  placeOrderFromCart,
  paymentPlaceOrder,
  validateOrder,
  webhookHandler,

};
