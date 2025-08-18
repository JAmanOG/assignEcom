import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import {createProduct,deleteProduct,getAllProducts,getProductDetails,updateProduct,getProductByFilter} from "../controller/products.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { listProductsQuerySchema, filterProductsQuerySchema, createProductSchema, updateProductSchema, idParamSchema } from "../validation/schemas.js";

/**
 * @openapi
 * tags:
 *   - name: Products
 *     description: Product catalog operations
 *
 * /api/products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all products (with optional filters & pagination)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, price, name, stock, id]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Products list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 totalProducts:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *   post:
 *     tags:
 *       - Products
 *     summary: Create a new product (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateProductRequest'
 *               - type: object
 *                 properties:
 *                   imagesURL:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 * /api/products/filter:
 *   get:
 *     tags:
 *       - Products
 *     summary: Filter products by dynamic criteria
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Filtered products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *
 * /api/products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     tags:
 *       - Products
 *     summary: Update product (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/UpdateProductRequest'
 *               - type: object
 *                 properties:
 *                   imagesURL:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *     responses:
 *       200:
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     tags:
 *       - Products
 *     summary: Delete product (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */


const router = Router();

// Wrap controller functions to conform to Express RequestHandler typing
const createProductHandler: RequestHandler = (req, res, next) => {
    Promise.resolve(createProduct(req as any, res)).catch(next);
};
const updateProductHandler: RequestHandler = (req, res, next) => {
    Promise.resolve(updateProduct(req as any, res)).catch(next);
};

// Order routes to avoid /filter being captured by /:id
router.get("/", validate({ query: listProductsQuerySchema }), getAllProducts);
router.get("/filter", validate({ query: filterProductsQuerySchema }), getProductByFilter); // moved before ":id"
router.get("/:id", validate({ params: idParamSchema }), getProductDetails);

router.post("/", authMiddleware, roleMiddleware(["ADMIN"]), upload.fields([{ name: "imagesURL", maxCount: 5 }]), validate({ body: createProductSchema }), createProductHandler);
router.put("/:id", authMiddleware, roleMiddleware(["ADMIN"]), upload.fields([{ name: "imagesURL", maxCount: 5 }]), validate({ params: idParamSchema, body: updateProductSchema }), updateProductHandler);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), validate({ params: idParamSchema }), deleteProduct);

export default router;