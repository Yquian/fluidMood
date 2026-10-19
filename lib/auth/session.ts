import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "fm_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 天

export type AuthUser = {
  id: number;
  username: string;
};

/** 只暴露给客户端的最小用户信息 */
export function toAuthUser(user: {
  id: number;
  username: string;
}): AuthUser {
  return { id: user.id, username: user.username };
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  };
}

/** 创建会话并把 token 写入 httpOnly Cookie */
export function createSession(userId: number): string {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  db.insert(sessions).values({ token, userId, expiresAt }).run();

  cookies().set(SESSION_COOKIE, token, cookieOptions());

  return token;
}

/** 读取当前会话对应的用户，未登录或已过期时返回 null */
export function getSessionUser(): AuthUser | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const [row] = db
    .select({ id: users.id, username: users.username })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(eq(sessions.token, token), gt(sessions.expiresAt, new Date().toISOString()))
    )
    .all();

  return row ?? null;
}

/** 销毁当前会话并清除 Cookie */
export function destroySession(): void {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    db.delete(sessions).where(eq(sessions.token, token)).run();
  }

  cookies().delete(SESSION_COOKIE);
}
