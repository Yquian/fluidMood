"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { VisualCalendar } from "@/components/ui/VisualCalendar";
import type { EmotionRecord } from "@/utils/mockData";

type MoodEntryResponse = {
  id: number;
  createdAt: string;
  text: string;
  primaryColor: string;
  secondaryColor: string;
  speed: number;
  turbulence: number;
  tags: string[];
  echo: string;
};

export default function GalleryPage() {
  const [records, setRecords] = useState<EmotionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newId, setNewId] = useState<number | null>(null);

  // 首页记录完成后会以 ?new=<id> 跳转过来，用于触发新卡片的入场动画
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("new");
    if (raw && /^\d+$/.test(raw)) {
      setNewId(Number(raw));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      try {
        const response = await fetch("/api/moods", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`读取情绪记录失败: ${response.status}`);
        }

        const data = (await response.json()) as MoodEntryResponse[];
        if (cancelled) return;

        setRecords(
          data.map(({ id, createdAt, primaryColor, secondaryColor, text, echo, tags }) => ({
            id,
            date: createdAt.slice(0, 10),
            primaryColor,
            secondaryColor,
            text,
            echo,
            tags,
          }))
        );
      } catch (error) {
        console.error("加载情绪画廊失败:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="relative isolate flex h-dvh flex-col overflow-y-auto overflow-x-hidden bg-[#FDFBF7] px-3 [scrollbar-color:#E7E5E4_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb:hover]:bg-stone-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-200 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5 sm:px-6">
      {/* 纸张颗粒 + 亚麻织纹 */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.12] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "140px 140px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-40 mix-blend-multiply"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(120,113,108,0.10) 0px, rgba(120,113,108,0.10) 1px, transparent 1px, transparent 5px), repeating-linear-gradient(90deg, rgba(120,113,108,0.10) 0px, rgba(120,113,108,0.10) 1px, transparent 1px, transparent 5px)",
          backgroundSize: "5px 5px, 5px 5px",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col py-6 sm:w-[80%] sm:py-8">
        <header className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            aria-label="回到今天"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-stone-500 ring-1 ring-inset ring-stone-200/70 backdrop-blur-sm transition-colors hover:text-stone-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex min-w-0 flex-col gap-1">
            <h1
              className="text-xl font-medium tracking-[0.18em] text-stone-800 sm:text-2xl"
              style={{
                fontFamily: "'Noto Serif SC', 'Songti SC', SimSun, serif",
              }}
            >
              情绪画廊
            </h1>
            <p className="truncate text-xs tracking-wide text-stone-400 sm:text-sm">
              过去 30 天的情绪都留在了颜色里，点开任意一天，听听那天的回音。
            </p>
          </div>
        </header>

        <section className="flex flex-1 items-center py-8">
          {loading ? (
            <p className="w-full text-center text-sm tracking-wide text-stone-400">
              正在加载情绪记录...
            </p>
          ) : records.length === 0 ? (
            <p className="w-full text-center text-sm tracking-wide text-stone-400">
              还没有记录，去首页写下今天的心情吧。
            </p>
          ) : (
            <VisualCalendar
              records={records}
              newId={newId}
              onDelete={(id) =>
                setRecords((prev) => prev.filter((item) => item.id !== id))
              }
              className="w-full"
            />
          )}
        </section>

        <p className="pb-1 text-center text-xs tracking-[0.25em] text-stone-400">
          每一格颜色，都是认真生活过的痕迹
        </p>
      </div>
    </main>
  );
}
