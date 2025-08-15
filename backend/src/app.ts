import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

export const app = express();

const corsOptions = {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));

app.use(cookieParser());

// Import routes
import userRoutes from "./routes/user.route.js";
import productRoutes from "./routes/products.route.js";
import categoryRoutes from "./routes/categories.route.js";
import orderRoutes from "./routes/orders.route.js";
import cartRoutes from "./routes/carts.route.js";
import deliveryRoutes from "./routes/delivery.route.js";
import adminDataRoutes from "./routes/adminData.route.js";

// Use routes
app.use("/api/auth", userRoutes);
app.use("/api/shop/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/admin", adminDataRoutes);


