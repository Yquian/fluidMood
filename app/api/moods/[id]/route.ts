import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { moodEntries } from "@/db/schema";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "记录 id 不正确" }, { status: 400 });
  }

  try {
    const deleted = db
      .delete(moodEntries)
      .where(eq(moodEntries.id, id))
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
