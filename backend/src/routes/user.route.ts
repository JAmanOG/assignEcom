import { Router } from "express";
import {changePassword,getCurrentUser,loginUser,logoutUser,registerUser,updatingUser,listUsers,rotateRefreshToken, createAdminUser,createDeliveryPartner} from "../controller/user.controller.js"
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { registerUserSchema, loginUserSchema, updateUserSchema, changePasswordSchema, listUsersQuerySchema } from "../validation/schemas.js";
const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: User authentication and management
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RegisterRequest' }
 *     responses:
 *       201:
 *         description: User registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginRequest' }
 *     responses:
 *       200:
 *         description: Login success
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Logout success
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GenericMessageResponse' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 * /api/auth/change-password:
 *   put:
 *     tags: [Auth]
 *     summary: Change current user password
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ChangePasswordRequest' }
 *     responses:
 *       200:
 *         description: Password changed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GenericMessageResponse' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 * /api/auth/users:
 *   get:
 *     tags: [Auth]
 *     summary: List users (Admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { $ref: '#/components/schemas/Role' }
 *     responses:
 *       200:
 *         description: Users list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 users:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 * /api/auth/update:
 *   put:
 *     tags: [Auth]
 *     summary: Update current user profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateUserRequest' }
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 * /api/auth/rotate-refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Tokens rotated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GenericMessageResponse' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 */

router.post("/register", validate({ body: registerUserSchema }), registerUser);
router.put("/update", authMiddleware, validate({ body: updateUserSchema }), updatingUser);
router.post("/login", validate({ body: loginUserSchema }), loginUser);
router.post("/logout", authMiddleware, logoutUser);
router.put("/change-password", authMiddleware, validate({ body: changePasswordSchema }), changePassword);
router.get("/me", authMiddleware, getCurrentUser);
router.get("/users", authMiddleware, roleMiddleware(["ADMIN"]), validate({ query: listUsersQuerySchema }), listUsers);
router.post("/rotate-refresh-token", authMiddleware, rotateRefreshToken);

// Admin and Delivery Partner creation routes
// router.post("/admin-create", createAdminUser);
// router.post("/create-delivery-partner", createDeliveryPartner);

export default router;