import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { createCategory,deleteCategory,getAllCategories,updateCategory } from "../controller/categories.controller.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Categories
 *     description: Product category management
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all categories
 *     responses:
 *       200:
 *         description: Categories fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 categories:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Category' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 *   post:
 *     tags: [Categories]
 *     summary: Create category (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateCategoryRequest' }
 *     responses:
 *       201:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 category: { $ref: '#/components/schemas/Category' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 * /api/categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update category (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateCategoryRequest' }
 *     responses:
 *       200:
 *         description: Category updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 category: { $ref: '#/components/schemas/Category' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 *   delete:
 *     tags: [Categories]
 *     summary: Delete category (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GenericMessageResponse' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */

router.get("/", getAllCategories);
router.post("/", authMiddleware, roleMiddleware(["ADMIN"]), createCategory);
router.put("/:id", authMiddleware, roleMiddleware(["ADMIN"]), updateCategory);
router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), deleteCategory);

export default router;
