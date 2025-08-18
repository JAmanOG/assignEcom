import dotenv from "dotenv";
import { app } from "./app.js";
import { PORT } from "./constant.js";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

dotenv.config();

const swaggerOptions = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "E-Commerce API",
      version: "1.0.0",
      description: "Comprehensive API documentation for the E-Commerce platform.",
    },
    servers: [
        { url: "https://assignecom.onrender.com", description: "Production" },
        { url: "http://localhost:3000", description: "Development" },
    ],
    components: { },
  },
  apis: ["./src/routes/*.ts", "./src/docs/*.ts"],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.get("/", (_req, res) => res.send("Hello World!"));

app.get("/health", (_req, res) => res.status(200).json({ message: "Server is healthy" }));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
