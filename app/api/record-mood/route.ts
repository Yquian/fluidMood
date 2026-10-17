import { NextResponse } from "next/server";

import { db } from "@/db";
import { moodEntries } from "@/db/schema";

export const runtime = "nodejs";

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

type RecordMoodBody = {
  text?: unknown;
  primaryColor?: unknown;
  secondaryColor?: unknown;
  speed?: unknown;
  turbulence?: unknown;
  tags?: unknown;
  echo?: unknown;
};

export async function POST(request: Request) {
  let body: RecordMoodBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是合法的 JSON" }, { status: 400 });
  }

  const { text, primaryColor, secondaryColor, speed, turbulence, tags, echo } =
    body;

  const isValid =
    typeof text === "string" &&
    text.trim().length > 0 &&
    typeof primaryColor === "string" &&
    HEX_COLOR.test(primaryColor) &&
    typeof secondaryColor === "string" &&
    HEX_COLOR.test(secondaryColor) &&
    typeof speed === "number" &&
    Number.isFinite(speed) &&
    typeof turbulence === "number" &&
    Number.isFinite(turbulence) &&
    Array.isArray(tags) &&
    tags.every((tag) => typeof tag === "string") &&
    typeof echo === "string" &&
    echo.trim().length > 0;

  if (!isValid) {
    return NextResponse.json({ error: "情绪数据格式不正确" }, { status: 400 });
  }

  try {
    const [created] = db
      .insert(moodEntries)
      .values({
        text: (text as string).trim(),
        primaryColor: primaryColor as string,
        secondaryColor: secondaryColor as string,
        speed: speed as number,
        turbulence: turbulence as number,
        tags: JSON.stringify(tags),
        echo: (echo as string).trim(),
      })
      .returning()
      .all();

    return NextResponse.json(
      {
        ...created,
        tags: JSON.parse(created.tags),
        speed: Number(created.speed),
        turbulence: Number(created.turbulence),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("写入情绪日记失败:", error);
    return NextResponse.json({ error: "写入情绪日记失败" }, { status: 500 });
  }
}
