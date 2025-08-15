import { Router } from "express";
import {changePassword,getCurrentUser,loginUser,logoutUser,registerUser,updatingUser,listUsers,rotateRefreshToken} from "../controller/user.controller.js"
import { authMiddleware } from "../middleware/auth.middleware.js";
import { roleMiddleware } from "../middleware/role.middleware.js";
const router = Router();

// POST /api/auth/login - User login 
// POST /api/auth/logout - User logout
// GET /api/auth/me - Get current user info
// POST /api/auth/register - User registration
// PUT /api/auth/change-password - Change user password

router.post("/register", registerUser);
router.put("/update", authMiddleware, updatingUser);
router.post("/login", loginUser);
router.post("/logout", authMiddleware, logoutUser);
router.put("/change-password", authMiddleware, changePassword);
router.get("/me", authMiddleware, getCurrentUser);
router.get("/users", authMiddleware, roleMiddleware(["ADMIN"]), listUsers);
router.post("/rotate-refresh-token", authMiddleware, rotateRefreshToken);

export default router;