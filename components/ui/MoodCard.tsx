"use client";

import { format, parseISO } from "date-fns";

import type { EmotionRecord } from "@/utils/mockData";

type MoodCardProps = {
  record: EmotionRecord;
  onOpen?: (record: EmotionRecord) => void;
  /** 随机的初始倾斜角度类，hover 时会摆正 */
  tiltClassName?: string;
  className?: string;
};

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** 情绪明信片：拍立得白边 + 柔和渐变底片 + 衬线回音 */
export function MoodCard({
  record,
  onOpen,
  tiltClassName,
  className,
}: MoodCardProps) {
  const date = parseISO(record.date);

  return (
    <button
      type="button"
      onClick={() => onOpen?.(record)}
      aria-label={`${format(date, "M 月 d 日")}，${record.echo}`}
      className={`group relative flex h-64 w-48 flex-col rounded-md bg-[#FFFDF9] p-2.5 text-left shadow-[0_8px_24px_rgba(68,64,60,0.12)] ring-1 ring-inset ring-stone-900/5 outline-none transition-all duration-300 ease-out hover:-translate-y-2 hover:rotate-0 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-stone-400 sm:w-52 ${
        tiltClassName ?? ""
      } ${className ?? ""}`}
    >
      {/* 照片区域：柔和渐变 */}
      <span
        className="relative flex flex-1 flex-col overflow-hidden rounded-[3px] px-4 pb-3.5 pt-4"
        style={{
          backgroundImage: `linear-gradient(150deg, ${record.primaryColor}, ${record.secondaryColor})`,
        }}
      >
        <p
          className="flex flex-1 items-center justify-center text-center text-base leading-relaxed text-white drop-shadow-sm"
          style={{
            fontFamily: "'Noto Serif SC', 'Songti SC', SimSun, serif",
          }}
        >
          {record.echo}
        </p>

        <span className="flex flex-wrap justify-center gap-1.5">
          {record.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] leading-none text-white/90 ring-1 ring-inset ring-white/20"
            >
              #{tag}
            </span>
          ))}
        </span>
      </span>

      {/* 拍立得白色留白：底部手写感日期 */}
      <span className="flex items-baseline justify-between px-1 pb-0.5 pt-3">
        <span className="text-[10px] font-medium tracking-[0.25em] text-stone-500">
          {format(date, "MM.dd")}
        </span>
        <span className="text-[10px] tracking-[0.2em] text-stone-400">
          周{WEEKDAYS[date.getDay()]}
        </span>
      </span>
    </button>
  );
}
