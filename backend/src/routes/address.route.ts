import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
import { createAddress,deleteAddress,getAddresses,updateAddress } from "../controller/address.controller.js";

const router = Router();

// GET /api/address - Fetch all addresses (Customer only)
// POST /api/address - Add new address (Customer only)
// PUT /api/address/:id - Update address (Customer only)
// DELETE /api/address/:id - Delete address (Customer only)

router.get("/", authMiddleware,roleMiddleware(["CUSTOMER"]), getAddresses);
router.post("/", authMiddleware,roleMiddleware(["CUSTOMER"]), createAddress);
router.put("/:id", authMiddleware,roleMiddleware(["CUSTOMER"]), updateAddress);
router.delete("/:id", authMiddleware,roleMiddleware(["CUSTOMER"]), deleteAddress);

export default router;