import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { moodEntries } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "记录 id 不正确" }, { status: 400 });
  }

  try {
    const deleted = db
      .delete(moodEntries)
      .where(and(eq(moodEntries.id, id), eq(moodEntries.userId, user.id)))
      .returning()
      .all();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("删除情绪日记失败:", error);
    return NextResponse.json({ error: "删除情绪日记失败" }, { status: 500 });
  }
}
