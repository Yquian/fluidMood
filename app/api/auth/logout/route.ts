import { NextResponse } from "next/server";

import { destroySession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    destroySession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("退出登录失败:", error);
    return NextResponse.json({ error: "退出登录失败" }, { status: 500 });
  }
}
