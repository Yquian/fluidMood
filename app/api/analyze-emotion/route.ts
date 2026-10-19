import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = "https://api.deepseek.com";
const MODEL = "deepseek-chat";

// 解析失败时使用的默认配置：全蓝色、低速度
const FALLBACK_MOOD = {
  primary_color: "#1e3a8a",
  secondary_color: "#3b82f6",
  speed: 0.15,
  turbulence: 0.2,
  tags: [],
  echo: "先深呼吸，让心绪像水一样慢慢沉静下来。",
};

export async function POST(request: Request) {
  if (!getSessionUser()) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: { text?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是合法的 JSON" }, { status: 400 });
  }

  const { text } = body;
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text 不能为空" }, { status: 400 });
  }

  try {
    const systemPrompt = await readFile(
      path.join(process.cwd(), "moodEngine.txt"),
      "utf8"
    );

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `DeepSeek 请求失败: ${response.status} ${await response.text()}`
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("AI 返回内容为空");
    }

    const mood = JSON.parse(content);
    return NextResponse.json(mood);
  } catch (error) {
    console.error("情绪分析失败，返回默认配置:", error);
    return NextResponse.json(FALLBACK_MOOD);
  }
}
