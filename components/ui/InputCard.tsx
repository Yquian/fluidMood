"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { MoodCard } from "@/components/ui/MoodCard";
import { Textarea } from "@/components/ui/textarea";
import { FluidBackground } from "@/components/three/FluidBackground";
import { cn } from "@/lib/utils";
import {
  emotionKeywords,
  type EmotionCategory,
  type EmotionProfile,
} from "@/utils/emotionDictionary";

const DEFAULT_EMOTION: EmotionCategory = "calm";
const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function analyzeEmotion(text: string): EmotionProfile {
  let matched: EmotionCategory = DEFAULT_EMOTION;
  let maxCount = 0;

  for (const key of Object.keys(emotionKeywords) as EmotionCategory[]) {
    const profile = emotionKeywords[key];
    const count = profile.words.reduce(
      (total, word) => total + (text.split(word).length - 1),
      0
    );

    if (count > maxCount) {
      maxCount = count;
      matched = key;
    }
  }

  return emotionKeywords[matched];
}

type AnalyzeResponse = {
  primary_color?: unknown;
  secondary_color?: unknown;
  speed?: unknown;
  turbulence?: unknown;
  tags?: unknown;
  echo?: unknown;
};

type EmotionCardData = {
  primaryColor: string;
  secondaryColor: string;
  speed: number;
  turbulence: number;
  tags: string[];
  echo: string;
  date: string;
};
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// AI 返回的数据做一次兜底，缺失或格式不对时回退到本地情绪词库
function normalizeMood(
  data: AnalyzeResponse,
  fallback: EmotionProfile
): Omit<EmotionCardData, "date"> {
  return {
    primaryColor:
      typeof data.primary_color === "string" &&
      HEX_COLOR.test(data.primary_color)
        ? data.primary_color
        : fallback.color,
    secondaryColor:
      typeof data.secondary_color === "string" &&
      HEX_COLOR.test(data.secondary_color)
        ? data.secondary_color
        : fallback.color,
    speed:
      typeof data.speed === "number" && Number.isFinite(data.speed)
        ? clamp01(data.speed)
        : fallback.speed,
    turbulence:
      typeof data.turbulence === "number" && Number.isFinite(data.turbulence)
        ? clamp01(data.turbulence)
        : fallback.turbulence,
    tags: Array.isArray(data.tags)
      ? data.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 3)
      : [],
    echo:
      typeof data.echo === "string" && data.echo.trim()
        ? data.echo.trim()
        : "这一刻的情绪，已经被好好收下了。",
  };
}

// 与数据库 createdAt 保持一致，统一使用 UTC 日期
const todayISO = () => new Date().toISOString().slice(0, 10);

// 由情绪主色派生一个同色相的浅色搭档，避免背景始终混入固定紫色
function lightenColor(hex: string, amount: number): string {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((char) => char + char)
          .join("")
      : raw;
  const value = parseInt(full, 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  const mixed = channels.map((channel) =>
    Math.round(channel + (255 - channel) * amount)
      .toString(16)
      .padStart(2, "0")
  );
  return `#${mixed.join("")}`;
}

export function InputCard({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [card, setCard] = React.useState<EmotionCardData | null>(null);

  const liveMood = analyzeEmotion(value);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = value.trim();
    if (!text || pending) return;

    const fallback = analyzeEmotion(text);
    setPending(true);

    let mood: Omit<EmotionCardData, "date">;

    try {
      const response = await fetch("/api/analyze-emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`情绪分析请求失败: ${response.status}`);
      }

      const data = (await response.json()) as AnalyzeResponse;
      mood = normalizeMood(data, fallback);
    } catch (error) {
      console.error("情绪分析失败，使用本地词库兜底:", error);
      mood = normalizeMood({}, fallback);
    }

    setCard({
      ...mood,
      date: todayISO(),
    });
    setValue("");

    let savedId: number | undefined;

    try {
      const response = await fetch("/api/record-mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, ...mood }),
      });

      if (!response.ok) {
        throw new Error(`情绪日记保存失败: ${response.status}`);
      }

      const saved = (await response.json()) as { id?: unknown };
      if (typeof saved.id === "number") {
        savedId = saved.id;
      }
    } catch (error) {
      console.error("情绪日记保存失败:", error);
    } finally {
      setPending(false);
    }

    // 留出拍立得落位的动画时间，再把新卡片 id 带到画廊触发插入动画
    window.setTimeout(() => {
      router.push(savedId ? `/gallery?new=${savedId}` : "/gallery");
    }, 1000);
  };

  return (
    <>
      <FluidBackground
        color1={card ? card.primaryColor : liveMood.color}
        color2={
          card ? card.secondaryColor : lightenColor(liveMood.color, 0.38)
        }
        speed={card ? card.speed : liveMood.speed}
        turbulence={card ? card.turbulence : liveMood.turbulence}
        frozen={Boolean(card)}
      />

      {card ? (
        <motion.div
          key="mood-card"
          initial={{ opacity: 0, y: 48, rotate: -7, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 170, damping: 20 }}
          className="flex flex-col items-center"
        >
          <MoodCard record={card} tiltClassName="rotate-[1.5deg]" />

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setCard(null);
                setValue("");
              }}
              className="text-xs tracking-[0.2em] text-zinc-500 transition-colors hover:text-zinc-900"
            >
              再记录一次
            </button>
          </div>
        </motion.div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={cn(
            "flex w-full max-w-xl flex-col items-center gap-8",
            className
          )}
          {...props}
        >
          {/* 毛玻璃输入框：外层做白色渐变描边与投影，内层负责磨砂与透明 */}
          <div className="group relative w-full rounded-3xl bg-gradient-to-br from-white/90 via-white/40 to-white/70 p-px shadow-[0_18px_60px_-30px_rgba(24,24,27,0.35)] transition-shadow duration-500 focus-within:shadow-[0_22px_70px_-28px_rgba(24,24,27,0.45)]">
            <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-white/30 backdrop-blur-3xl backdrop-saturate-150 ring-1 ring-inset ring-white/60">
              {/* 顶部高光，让玻璃有厚度 */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/60 to-transparent" />

              <Textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="今天感觉怎么样..."
                aria-label="今天的情绪日记"
                rows={7}
                className="relative min-h-[200px] resize-none rounded-[calc(1.5rem-1px)] border-0 bg-transparent px-6 py-6 text-base leading-relaxed text-zinc-900 shadow-none placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-lg md:text-lg [scrollbar-color:#E7E5E4_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb:hover]:bg-stone-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-200 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
              />
            </div>
          </div>

          {/* 毛玻璃按钮：与输入框保持同一质感的无彩色玻璃 */}
          <Button
            type="submit"
            disabled={pending || !value.trim()}
            className="h-12 rounded-full border-none bg-white/60 px-10 text-sm font-medium tracking-[0.25em] text-stone-700 shadow-[0_10px_30px_-10px_rgba(24,24,27,0.15)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_40px_-14px_rgba(24,24,27,0.22)] focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-0 active:translate-y-0 active:shadow-[0_6px_18px_-10px_rgba(24,24,27,0.18)] disabled:translate-y-0 disabled:shadow-none"
          >
            {pending ? "解析中..." : "记录情绪"}
          </Button>
        </form>
      )}
    </>
  );
}
