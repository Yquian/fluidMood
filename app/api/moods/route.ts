import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { moodEntries } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RECENT_LIMIT = 30;

function parseTags(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const user = getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const rows = db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, user.id))
      .orderBy(desc(moodEntries.createdAt))
      .limit(RECENT_LIMIT)
      .all();

    const data = rows.map((row) => ({
      ...row,
      tags: parseTags(row.tags),
      speed: Number(row.speed),
      turbulence: Number(row.turbulence),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("读取情绪日记失败:", error);
    return NextResponse.json({ error: "读取情绪日记失败" }, { status: 500 });
  }
}
