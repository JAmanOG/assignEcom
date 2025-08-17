import { prisma } from "../prismaClient.js";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../constant.js";

export const roleMiddleware = (roles: string[]) => {
    return async (req: Request, res: Response, next: Function) => {
        console.log("Role middleware triggered");
        const token = req.cookies?.accessToken  || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            console.log("No token provided");
            return res.status(401).json({ message: "Unauthorized" });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET as string) as { id: string, role: string };
            console.log("Decoded token:", decoded);
            
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    phone: true,
                    role: true,
                    password_hashed: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true,
                }
            });

            if (!user) {
                console.log("User not found");
                return res.status(401).json({ message: "Unauthorized" });
            }

            // Check if user has the required role
            if (!roles.includes(user.role)) {
                console.log("User does not have the required role");
                return res.status(403).json({ message: "Forbidden" });
            }

            // Attach user to request object
            req.user = user;
            console.log("User authenticated:", user);
            next();
        } catch (error) {
            console.error("Error in role middleware:", error);
            return res.status(401).json({ message: "Unauthorized" });
        }
    };
};
