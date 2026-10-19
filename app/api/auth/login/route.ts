import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, toAuthUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 用户不存在时用它跑一次假校验，避免暴露「该用户名是否已注册」
const DUMMY_SALT = "00000000000000000000000000000000";
const DUMMY_HASH = "0".repeat(128);

type AuthBody = {
  username?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let body: AuthBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是合法的 JSON" }, { status: 400 });
  }

  const { username, password } = body;
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 });
  }

  const normalized = username.trim().toLowerCase();

  try {
    const [user] = db
      .select()
      .from(users)
      .where(eq(users.username, normalized))
      .all();

    const passed = user
      ? verifyPassword(password, user.passwordSalt, user.passwordHash)
      : (verifyPassword(password, DUMMY_SALT, DUMMY_HASH), false);

    if (!user || !passed) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    createSession(user.id);

    return NextResponse.json({ user: toAuthUser(user) });
  } catch (error) {
    console.error("登录失败:", error);
    return NextResponse.json({ error: "登录失败，请稍后再试" }, { status: 500 });
  }
}
