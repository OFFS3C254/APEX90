import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "apex90-super-secure-production-key-2026"
);

export const ADMIN_COOKIE_NAME = "apex_admin_session";

export interface AdminPayload {
  id: string;
  email: string;
  name: string;
}

/**
 * Initializes the default admin if no admins exist in database
 */
export async function ensureDefaultAdmin() {
  const admin = db.prepare("SELECT * FROM admins LIMIT 1").get() as any;
  if (!admin) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("Admin12345!", salt);
    db.prepare(`
      INSERT INTO admins (id, email, password_hash, name, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      "admin-01",
      "admin@apex90.com",
      hash,
      "Apex Head Strategist",
      new Date().toISOString()
    );
    console.log("Default admin initialized: admin@apex90.com / Admin12345!");
  }
}

/**
 * Creates signed JWT for authenticated admin
 */
export async function signAdminToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verifies admin JWT token
 */
export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

/**
 * Gets currently logged in admin session from request cookies
 */
export async function getAdminSession(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
