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
    JWT_SECRET as string,
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

export const allFieldRequired = (fields: Record<string, any>): boolean => {
  const missing = Object.entries(fields)
    .filter(([_, v]) => v === undefined || v === null || v === "")
    .map(([k]) => k);
  return missing.length === 0;
};

export const allArrayRequired = (values: any[]): boolean => {
  return values.every(v => v !== undefined && v !== null && v !== "");
};


export const ORFieldRequired = (fields: { [key: string]: any }): boolean => {
  const filledFields = Object.entries(fields)
    .filter(([_, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, _]) => key);

  if (filledFields.length === 0) {
    throw new Error("At least one field must be provided");
  }

  return true;
}


export interface ExtractedTokens {
  accessToken?: string;
  refreshToken?: string;
}

export function extractAccessToken(req: any): string | undefined {
  const header = req.header("Authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return req.cookies?.accessToken;
}

export function extractRefreshToken(req: any): string | undefined {
  const header = req.header("Authorization");
  if (header?.startsWith("Bearer ")) {
    const raw = header.slice(7).trim();
    if (raw.startsWith("rt_")) return raw.substring(3);
  }
  // Fallback body
  if (req.body?.refreshToken) return req.body.refreshToken;
  // Cookie last
  return req.cookies?.refreshToken;
}

export function shouldIncludeInBody(): boolean {
  const mode = process.env.TOKEN_RESPONSE_MODE || "cookie";
  return mode === "body" || mode === "both";
}

export function shouldSetCookies(): boolean {
  const mode = process.env.TOKEN_RESPONSE_MODE || "cookie";
  return mode === "cookie" || mode === "both";
}

export function includeRefreshInBody(): boolean {
  return (process.env.INCLUDE_REFRESH_TOKEN_IN_BODY || "false").toLowerCase() === "true";
}