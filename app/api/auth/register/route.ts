import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSession, toAuthUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USERNAME_MIN = 2;
const USERNAME_MAX = 20;
const PASSWORD_MIN = 6;

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

  if (normalized.length < USERNAME_MIN || normalized.length > USERNAME_MAX) {
    return NextResponse.json(
      { error: `用户名长度需在 ${USERNAME_MIN}-${USERNAME_MAX} 个字符之间` },
      { status: 400 }
    );
  }

  if (password.length < PASSWORD_MIN) {
    return NextResponse.json(
      { error: `密码至少需要 ${PASSWORD_MIN} 位` },
      { status: 400 }
    );
  }

  try {
    const existing = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, normalized))
      .all();

    if (existing.length > 0) {
      return NextResponse.json({ error: "该用户名已被注册" }, { status: 409 });
    }

    const { hash, salt } = hashPassword(password);

    const [created] = db
      .insert(users)
      .values({ username: normalized, passwordHash: hash, passwordSalt: salt })
      .returning({ id: users.id, username: users.username })
      .all();

    createSession(created.id);

    return NextResponse.json({ user: toAuthUser(created) }, { status: 201 });
  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json({ error: "注册失败，请稍后再试" }, { status: 500 });
  }
}
