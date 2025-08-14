import { prisma } from "../index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import {
  comparePasswords,
  hashPassword,
  isPasswordValid,
  allFieldRequired,
  ORFieldRequired,
} from "../helper/helper.js";
import type { Request, Response } from "express";
import type { GetAllProductsParams, ProductResult } from "../types/type.js";

const createProduct = async (req: Request, res: Response) => {
  const { name, description, price, stock, categoryId } = req.body;

  const isValid = allFieldRequired({
    name,
    description,
    price,
    stock,
    categoryId,
  });

  if (!isValid) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const newProduct = await prisma.products.create({
      data: {
        id: uuidv4(),
        name,
        description,
        price,
        stock,
        categoryId,
      },
    });

    if (!newProduct) {
      return res.status(500).json({ error: "Failed to create product" });
    }

    console.log("New product created:", newProduct);

    return res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAllProducts = async ({page = 1, limit = 10, search = "", sortBy = "created_at", sortOrder = "desc", id,}: GetAllProductsParams): Promise<ProductResult> => {
    try {
        // Case 1: fetch by id only
        if (id) {
            const product = await prisma.products.findUnique({
                where: { id },
            });

            if (!product) {
                return {
                    message: `Product with id ${id} not found`,
                    products: [],
                    totalProducts: 0,
                };
            }

            return {
                message: `Product with id ${id} fetched successfully`,
                products: [product],
                totalProducts: 1,
            };
        }

        // Case 2: normal query (search, pagination, etc.)
        const skip = (page - 1) * limit;
        const take = limit;
        const orderBy = {
            [sortBy]: sortOrder === "asc" ? "asc" : "desc",
        };

        const where = {
            name: {
                contains: search,
                mode: "insensitive" as const,
            },
        };

        const [products, totalProducts] = await Promise.all([
            prisma.products.findMany({ where, skip, take, orderBy }),
            prisma.products.count({ where }),
        ]);

        return {
            message: "Products fetched successfully",
            products,
            totalProducts,
            page,
            limit,
        };
    } catch (error) {
        console.error("Error fetching products:", error);
        throw new Error("Failed to fetch products");
    }
};

const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, price, stock, categoryId } = req.body;

  const isValid = allFieldRequired({
    id,
    name,
    description,
    price,
    stock,
    categoryId,
  });

  if (!isValid) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // is product exists
    const productExists = await prisma.products.findUnique({
      where: { id },
    });

    if (!productExists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const updatedProduct = await prisma.products.update({
      where: { id },
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
      },
    });

    if (!updatedProduct) {
      return res.status(500).json({ error: "Failed to update product" });
    }
    console.log("Product updated:", updatedProduct);
    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  try {
    const productExists = await prisma.products.findUnique({
      where: { id },
    });

    if (!productExists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const deletedProduct = await prisma.products.delete({
      where: { id },
    });

    console.log("Product deleted:", deletedProduct);
    return res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
};