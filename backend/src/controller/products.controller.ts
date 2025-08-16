import { prisma } from "../index.js";
import { v4 as uuidv4 } from "uuid";
import type { Request, Response } from "express";
// import type { ProductResult } from "../types/type.js";
import { uploadFilePath, DeleteOldImage } from "../utils/cloudnairy.js";
import { adjustStock } from "./inventory_transactions.controller.js";

const toNumber = (v: any) =>
  v === "" || v === null || v === undefined ? NaN : Number(v);

interface MulterRequest extends Request {
  files: { [fieldname: string]: Express.Multer.File[] };
}

// create a new product
const createProduct = async (req: MulterRequest, res: Response) => {
  const userId = req.user?.id || "system";
  const { name, description, price, stock, categoryId } = req.body;
  const priceNum = Number(price);
  const stockNum = parseInt(stock, 10);

  if (stockNum < 0) {
    return res.status(400).json({ error: "Stock cannot be negative" });
  }

  if (!name || !description || !price || !stock || !categoryId) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const category = await prisma.categories.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const filesArray = req.files?.["imagesURL"];
    if (!filesArray || filesArray.length === 0) {
      return res.status(400).json({ error: "Product image is required" });
    }

    const uploadedUrls: string[] = [];
    for (const file of filesArray) {
      const uploaded = await uploadFilePath(file.path);
      if (uploaded && typeof uploaded === "object" && "url" in uploaded) {
        uploadedUrls.push((uploaded as any).url);
      }
    }
    await prisma.$transaction(async (tx) => {
      const newProduct = await tx.products.create({
        data: {
          id: uuidv4(),
          name,
          description,
          price: priceNum,
          stock: stockNum,
          categoryId,
          imagesURL: {
            create: uploadedUrls.map((url, idx) => ({
              image_url: url,
              sort_order: idx + 1,
            })),
          },
        },
        include: { imagesURL: true, category: true },
      });

      await adjustStock(
        newProduct.id,
        stockNum,
        "Initial stock",
        userId,
        tx as typeof prisma
      );

      return res.status(201).json({
        message: "Product created successfully",
        product: newProduct,
      });
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get all products with optional filters, pagination, and sorting
const getAllProducts = async (req: Request, _res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "created_at",
      sortOrder = "desc",
      id,
    } = req.query;

    // Normalize / coerce query params
    const pageNum =
      typeof page === "string"
        ? parseInt(page, 10) || 1
        : Array.isArray(page)
        ? parseInt(page[0] as any, 10) || 1
        : (page as number) || 1;
    const limitNum =
      typeof limit === "string"
        ? parseInt(limit, 10) || 10
        : Array.isArray(limit)
        ? parseInt(limit[0] as any, 10) || 10
        : (limit as number) || 10;
    const searchStr = typeof search === "string" ? search : "";
    const sortByStrRaw = typeof sortBy === "string" ? sortBy : "created_at";
    const allowedSortFields = new Set([
      "created_at",
      "price",
      "name",
      "stock",
      "id",
    ]);
    const sortByStr = allowedSortFields.has(sortByStrRaw)
      ? sortByStrRaw
      : "created_at";
    const sortOrderStr = sortOrder === "asc" ? "asc" : "desc";
    const idStr = typeof id === "string" ? id : undefined;

    // Case 1: fetch by id only
    if (idStr) {
      const product = await prisma.products.findUnique({
        where: { id: idStr },
        include: { imagesURL: true, category: true },
      });

      if (!product) {
        return {
          message: `Product with id ${idStr} not found`,
          products: [],
          totalProducts: 0,
        };
      }

      return {
        message: `Product with id ${idStr} fetched successfully`,
        products: [product],
        totalProducts: 1,
      };
    }

    // Case 2: normal query (search, pagination, etc.)
    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const where: any = searchStr
      ? {
          name: {
            contains: searchStr,
            mode: "insensitive",
          },
        }
      : {};

    const orderBy: any = { [sortByStr]: sortOrderStr };

    const [products, totalProducts] = await Promise.all([
      prisma.products.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { imagesURL: true, category: true },
      }),
      prisma.products.count({ where }),
    ]);

    return {
      message: "Products fetched successfully",
      products,
      totalProducts,
      page: pageNum,
      limit: limitNum,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
};

// get product by filter
const getProductByFilter = async (req: Request, res: Response) => {
  const {
    categoryId,
    minPrice,
    maxPrice,
    search,
    inStock,
    page = "1",
    limit = "10",
  } = req.query;

  try {
    const where: any = {};

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Price filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    // Stock filter
    if (inStock === "true") {
      where.stock = { gt: 0 }; // only products with stock > 0
    }

    // Search filter
    if (search) {
      where.name = { contains: search as string, mode: "insensitive" };
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * pageSize;
    const take = pageSize;

    const products = await prisma.products.findMany({
      where,
      include: { imagesURL: true, category: true },
      skip,
      take,
    });

    return res.status(200).json({
      message: "Products fetched successfully",
      products,
      page: pageNum,
      limit: pageSize,
    });
  } catch (error) {
    console.error("Error fetching products by filter:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update product details by id
const updateProduct = async (req: MulterRequest, res: Response) => {
  const userId = req.user?.id || "system";
  const { id } = req.params;
  const { name, description, price, stock, categoryId } = req.body;

  // Safely access uploaded files
  const filesArray = req.files?.["imagesURL"] as
    | Express.Multer.File[]
    | undefined;
  const imageLocalPath = filesArray?.[0]?.path;

  if (!id) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  try {
    // Check product exists
    const productExists = await prisma.products.findUnique({
      where: { id },
      include: { imagesURL: true },
    });

    if (!productExists) {
      return res.status(404).json({ error: "Product not found" });
    }

    let uploadedUrl: string | undefined;
    if (imageLocalPath) {
      // Delete old image if exists
      if (productExists.imagesURL[0]) {
        await DeleteOldImage(productExists.imagesURL[0].image_url);
      }
      const uploaded = await uploadFilePath(imageLocalPath);
      uploadedUrl =
        typeof uploaded === "object" && uploaded && "url" in uploaded
          ? (uploaded as any).url
          : undefined;
      if (!uploadedUrl) {
        return res.status(500).json({ error: "Failed to upload image" });
      }
    }

    // Build update data
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined && !isNaN(toNumber(price)))
      data.price = toNumber(price);
    if (stock !== undefined && !isNaN(parseInt(stock, 10)))
      data.stock = parseInt(stock, 10);

    if (categoryId) {
      const cat = await prisma.categories.findUnique({
        where: { id: categoryId },
      });
      if (!cat) return res.status(404).json({ error: "Category not found" });
      data.categoryId = categoryId;
    }

    const updatedProduct = await prisma.products.update({
      where: { id },
      data,
      include: { imagesURL: true },
    });

    // Handle image update/insert
    if (uploadedUrl) {
      if (updatedProduct.imagesURL[0]) {
        await prisma.product_Images.update({
          where: { id: updatedProduct.imagesURL[0].id },
          data: {
            image_url: uploadedUrl,
            sort_order: updatedProduct.imagesURL[0].sort_order ?? 1,
          },
        });
      } else {
        await prisma.product_Images.create({
          data: { product_id: id!, image_url: uploadedUrl, sort_order: 1 },
        });
      }
    }

    if (stock && !isNaN(parseInt(stock, 10))) {
      await prisma.$transaction(async (tx) => {
        const finalProduct = await tx.products.findUnique({
          where: { id },
          include: { imagesURL: true, category: true },
        });

        if (!finalProduct)
          return res.status(404).json({ error: "Product not found" });

        const newStock = parseInt(stock, 10);
        const delta = newStock - finalProduct.stock; // <- compute delta

        await adjustStock(
          finalProduct.id,
          delta,
          "Stock updated",
          userId,
          tx as typeof prisma
        );

        return res.status(200).json({
          message: "Product updated successfully",
          product: finalProduct,
        });
      });
    } else {
      const finalProduct = await prisma.products.findUnique({
        where: { id },
        include: { imagesURL: true, category: true },
      });

      if (!finalProduct) {
        return res.status(404).json({ error: "Product not found" });
      }
      // Return updated product
      return res.status(200).json({
        message: "Product updated successfully",
        product: finalProduct,
      });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// delete the product based on id
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

    await prisma.$transaction(async (tx) => {
      const productImages = await tx.product_Images.findMany({
        where: { product_id: id },
      });

      if (productImages.length > 0) {
        for (const image of productImages) {
          await DeleteOldImage(image.image_url);
        }
        await tx.product_Images.deleteMany({
          where: { product_id: id },
        });
      }

      // Log final stock removal BEFORE deleting product
      if (productExists.stock > 0) {
        await tx.inventory_transactions.create({
          data: {
            product_id: productExists.id,
            delta: -productExists.stock,
            reason: "Product deleted",
            created_by: "system",
          },
        });
      }

      const deletedProduct = await tx.products.delete({
        where: { id },
      });

      return res.status(200).json({
        message: "Product deleted successfully",
        product: deletedProduct,
      });
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get product details
const getProductDetails = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  try {
    const product = await prisma.products.findUnique({
      where: { id },
      include: { imagesURL: true, category: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res
      .status(200)
      .json({ message: "Product fetched successfully", product });
  } catch (error) {
    console.error("Error fetching product details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  getProductDetails,
  getProductByFilter,
};
