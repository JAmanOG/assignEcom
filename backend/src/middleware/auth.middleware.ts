import { prisma } from "../prismaClient.js";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../constant.js";
import { extractAccessToken } from "../helper/helper.js";

export const authMiddleware = async (req: Request, res: Response, next: Function) => {
    // console.log("Auth middleware triggered");
    // console.log("Request headers:", req.cookies);
    // console.log('Authorization Header:', req.header("Authorization"));

    // const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    // console.log("Token:", token);
    const token = extractAccessToken(req);
    if (!token) return res.status(401).json({ message: "No access token provided" });

    try {
        const decodedUnverified = jwt.decode(token, { complete: true });
        console.log("Unverified decoded token:", decodedUnverified);
        
        console.log("Verifying token...",JWT_SECRET);
        const decoded = await jwt.verify(token, JWT_SECRET as string) as { id: string };
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