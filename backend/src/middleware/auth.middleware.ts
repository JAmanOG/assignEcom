import { prisma } from "../index.js";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = async (req: Request, res: Response, next: Function) => {
    console.log("Auth middleware triggered");
    console.log("Request headers:", req.cookies);
    console.log('Authorization Header:', req.header("Authorization"));

    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    console.log("Token:", token);

    if (!token) {
        return res.status(401).json({ message: "No access token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        console.log("Decoded token:", decoded);
        
        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id: decoded.id }});

        if (!user) {
            console.log("User not found");
            throw new Error("Unauthorized");
        }
        
        // Attach user to request object
        req.user = user;
        console.log("User authenticated:", user);
        next();
    } catch (err: any) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Access token expired" });
        }
        return res.status(401).json({ message: "Unauthorized" });
    }
}