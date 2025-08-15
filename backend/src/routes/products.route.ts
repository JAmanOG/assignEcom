import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import {createProduct,deleteProduct,getAllProducts,getProductDetails,updateProduct} from "../controller/products.controller.js";
import { upload } from "../middleware/multer.middleware.js";
const router = Router();

// Wrap controller functions to conform to Express RequestHandler typing
const createProductHandler: RequestHandler = (req, res, next) => {
    Promise.resolve(createProduct(req as any, res)).catch(next);
};
const updateProductHandler: RequestHandler = (req, res, next) => {
    Promise.resolve(updateProduct(req as any, res)).catch(next);
};

// GET /api/products - Fetch all products (with filters) 
// POST /api/products - Add new product (Admin only) 
// PUT /api/products/:id - Update product (Admin only) 
// DELETE /api/products/:id - Delete product (Admin only)

router.get("/", getAllProducts);
router.get("/:id", getProductDetails);

router.post("/", authMiddleware, roleMiddleware(["ADMIN"]), upload.fields([{
    name: "imagesURL",
    maxCount: 5
}]), createProductHandler);
router.put("/:id", authMiddleware, roleMiddleware(["ADMIN"]), upload.fields([{
    name: "imagesURL",
    maxCount: 5
}]), updateProductHandler);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), deleteProduct);

export default router;