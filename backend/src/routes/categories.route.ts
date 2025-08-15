import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { createCategory,deleteCategory,getAllCategories,updateCategory } from "../controller/categories.controller.js";

const router = Router();

// GET /api/categories - Fetch all categories
// POST /api/categories - Add new category (Admin only)
// PUT /api/categories/:id - Update category (Admin only)
// DELETE /api/categories/:id - Delete category (Admin only)

router.get("/", getAllCategories);
router.post("/", authMiddleware, roleMiddleware(["ADMIN"]), createCategory);
router.put("/:id", authMiddleware, roleMiddleware(["ADMIN"]), updateCategory);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), deleteCategory);

export default router;
