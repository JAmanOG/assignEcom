import { prisma } from "../prismaClient.js";
import { allFieldRequired } from "../helper/helper.js";
import type { Request, Response } from "express";

const addItemToCart = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { productId, quantity = 1 } = req.body;
  console.log("Adding item to cart:", { userId, productId, quantity });
  if (!allFieldRequired({ productId, quantity })) {
    return res.status(400).json({ message: "productId & quantity required" });
  }
  const product = await prisma.products.findUnique({
    where: { id: productId },
  });
  if (!product) return res.status(404).json({ message: "Product not found" });

  const cart = await prisma.carts.upsert({
    where: { userId: userId as string },
    create: { userId, items: { create: [] } } as any,
    update: {},
  });

  const existing = await prisma.cart_Items.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existing) {
    const updated = await prisma.cart_Items.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + quantity,
        total_price: (existing.quantity + quantity) * existing.unit_price,
      },
    });
    return res.json({ message: "Cart updated", item: updated });
  }

  const newItem = await prisma.cart_Items.create({
    data: {
      cartId: cart.id,
      productId,
      product_name: product.name,
      quantity,
      unit_price: product.price,
      total_price: product.price * quantity,
    },
  });
  return res.json({ message: "Item added", item: newItem });
};

// Get user's cart
const getUserCart = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  console.log("Fetching cart for user:", userId);
  // Validate userId
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    // Fetch user's cart
    const cart = await prisma.carts.findUnique({
      where: { userId: userId as string },
      include: {
        items: {
          include: {
            product: {
              select: {
                description: true,
                price: true,
                stock: true,
                imagesURL: {
                  select: { image_url: true },
                },
              },
            },
          },
        },
      },
    });
    
    console.log("Fetched cart:", cart);

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    return res.status(200).json({ message: "Cart fetched successfully", cart });
  } catch (error) {
    console.error("Error fetching user's cart:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Remove item from cart
const removeItemFromCart = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { itemId } = req.params;
  // Validate required fields
  const isAllfieldExist = allFieldRequired({ userId, itemId });
  if (!isAllfieldExist) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if cart item exists
    const cartItemExists = await prisma.cart_Items.findUnique({
      where: { id: itemId as string },
    });

    if (!cartItemExists) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const cart = await prisma.carts.findFirst({
      where: { id: cartItemExists.cartId, userId: userId as string },
    });
    if (!cart) return res.status(403).json({ message: "Forbidden" });

    // Remove item from cart
    await prisma.cart_Items.delete({
      where: { id: itemId as string },
    });

    return res
      .status(200)
      .json({ message: "Item removed from cart successfully" });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update cart item quantity
const updateCartItemQuantity = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { itemId } = req.params;
  const { quantity } = req.body;

  // Validate required fields
  const isAllfieldExist = allFieldRequired({ userId, itemId, quantity });
  if (!isAllfieldExist) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if cart item exists
    const cartItemExists = await prisma.cart_Items.findUnique({
      where: { id: itemId as string },
    });

    if (!cartItemExists) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Update cart item quantity
    const updatedCartItem = await prisma.cart_Items.update({
      where: { id: itemId as string },
      data: { quantity, total_price: cartItemExists.unit_price * quantity },
    });

    return res.status(200).json({
      message: "Cart item quantity updated successfully",
      updatedCartItem,
    });
  } catch (error) {
    console.error("Error updating cart item quantity:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export {
  addItemToCart,
  getUserCart,
  removeItemFromCart,
  updateCartItemQuantity,
};
