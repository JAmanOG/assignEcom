import { compare } from "bcryptjs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User } from "../types/type.js";
import { JWT_SECRET, JWT_REFRESH_SECRET } from "../constant.js";

export const generateAccessToken = (user: User) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

export const generateRefreshToken = (user: User) => {
  return jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

export const comparePasswords = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await compare(password, hashedPassword);
};

export const isPasswordValid = (
  password: string,
  hashedPassword: string
): boolean => {
  return bcrypt.compareSync(password, hashedPassword);
};

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Password hashing failed");
  }
};

export const allFieldRequired = (fields: { [key: string]: any }): boolean => {
  const missingFields = Object.entries(fields)
    .filter(([_, value]) => value === undefined || value === null || value === "")
    .map(([key, _]) => key);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  return true;
}

export const ORFieldRequired = (fields: { [key: string]: any }): boolean => {
  const filledFields = Object.entries(fields)
    .filter(([_, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, _]) => key);

  if (filledFields.length === 0) {
    throw new Error("At least one field must be provided");
  }

  return true;
}