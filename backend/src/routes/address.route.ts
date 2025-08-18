import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { createAddress,deleteAddress,getAddresses,updateAddress } from "../controller/address.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { createAddressSchema, updateAddressSchema, idParamSchema } from "../validation/schemas.js";

/**
 * @openapi
 * tags:
 *   - name: Address
 *     description: Manage customer saved addresses
 * /api/address:
 *   get:
 *     tags: [Address]
 *     summary: Get all addresses for current customer
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of addresses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Address' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *   post:
 *     tags: [Address]
 *     summary: Create a new address
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateAddressRequest' }
 *     responses:
 *       201:
 *         description: Address created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Address' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 * /api/address/{id}:
 *   put:
 *     tags: [Address]
 *     summary: Update an address
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
 *           schema: { $ref: '#/components/schemas/UpdateAddressRequest' }
 *     responses:
 *       200:
 *         description: Address updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Address' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 *   delete:
 *     tags: [Address]
 *     summary: Delete an address
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Address deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GenericMessageResponse' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */

const router = Router();

// GET /api/address - Fetch all addresses (Customer only)
// POST /api/address - Add new address (Customer only)
// PUT /api/address/:id - Update address (Customer only)
// DELETE /api/address/:id - Delete address (Customer only)

router.get("/", authMiddleware,roleMiddleware(["CUSTOMER"]), getAddresses);
router.post("/", authMiddleware,roleMiddleware(["CUSTOMER"]), validate({ body: createAddressSchema }), createAddress);
router.put("/:id", authMiddleware,roleMiddleware(["CUSTOMER"]), validate({ params: idParamSchema, body: updateAddressSchema }), updateAddress);
router.delete("/:id", authMiddleware,roleMiddleware(["CUSTOMER"]), validate({ params: idParamSchema }), deleteAddress);

export default router;