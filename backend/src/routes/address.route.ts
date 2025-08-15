import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { createAddress,deleteAddress,getAddresses,updateAddress } from "../controller/address.controller.js";

const router = Router();

// GET /api/address - Fetch all addresses (Customer only)
// POST /api/address - Add new address (Customer only)
// PUT /api/address/:id - Update address (Customer only)
// DELETE /api/address/:id - Delete address (Customer only)

router.get("/", authMiddleware, getAddresses);
router.post("/", authMiddleware, createAddress);
router.put("/:id", authMiddleware, updateAddress);
router.delete("/:id", authMiddleware, deleteAddress);

export default router;