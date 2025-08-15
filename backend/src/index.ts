import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { app as importedApp } from "./app.js";
import { PORT } from "./constant.js";

dotenv.config();
const app = importedApp;

export const prisma = new PrismaClient();

app.get("/", (_, res) => {
  res.send("Hello World!");
});

app.get("/health", (_, res) => {
  res.status(200).json({ message: "Server is healthy" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
