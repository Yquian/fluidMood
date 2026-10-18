"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { FluidModal } from "@/components/ui/FluidModal";
import { MoodCard } from "@/components/ui/MoodCard";
import type { EmotionRecord } from "@/utils/mockData";

/** 固定的“随意散落”角度，按索引循环，避免随机导致水合不一致 */
const TILTS = [
  "rotate-[1.5deg]",
  "-rotate-[1deg]",
  "rotate-[0.6deg]",
  "-rotate-[1.8deg]",
  "rotate-[1deg]",
  "-rotate-[0.5deg]",
  "rotate-[2deg]",
  "-rotate-[1.4deg]",
];

type VisualCalendarProps = {
  records: EmotionRecord[];
  className?: string;
  /** 本次新生成的记录 id，命中时播放插入动画 */
  newId?: number | null;
  /** 点击卡片时触发，回传 YYYY-MM-DD 日期 */
  onDateClick?: (date: string) => void;
  /** 删除记录后通知父级更新列表 */
  onDelete?: (id: number) => void;
};

export function VisualCalendar({
  records,
  className,
  newId,
  onDateClick,
  onDelete,
}: VisualCalendarProps) {
  const [selected, setSelected] = useState<EmotionRecord | null>(null);

  // 时间倒序：最新的情绪排在最前面
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records]
  );

  return (
    <>
      <div
        className={`flex flex-wrap justify-center gap-4 sm:gap-6 ${className ?? ""}`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {sortedRecords.map((record, index) => {
            const isNew = newId != null && record.id === newId;

            return (
              <motion.div
                key={record.id ?? record.date}
                layout="position"
                className="relative"
                exit={{
                  opacity: 0,
                  y: -220,
                  x: -32,
                  rotate: -9,
                  scale: 0.9,
                  filter: "blur(10px)",
                }}
                transition={{
                  duration: 1.8,
                  ease: "easeInOut",
                  layout: { duration: 0.6, ease: "easeInOut", delay: 1.5 },
                }}
              >
                {isNew ? (
                <>
                  {/* 落位瞬间的光晕扩散 */}
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.5),rgba(236,72,153,0.28)_45%,transparent_72%)] blur-2xl"
                    initial={{ opacity: 0.9, scale: 0.4 }}
                    animate={{ opacity: 0, scale: 2.2 }}
                    transition={{ duration: 1.8, ease: "easeOut", delay: 0.5 }}
                  />
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-amber-200/80"
                    initial={{ opacity: 0.9, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.4 }}
                    transition={{ duration: 1.1, ease: "easeOut", delay: 0.55 }}
                  />
                </>
              ) : null}

              <motion.div
                initial={
                  isNew
                    ? {
                        opacity: 0,
                        y: -240,
                        rotate: -16,
                        scale: 1.6,
                        rotateX: 65,
                        filter: "blur(16px)",
                      }
                    : false
                }
                animate={
                  isNew
                    ? {
                        opacity: 1,
                        y: 0,
                        rotate: 0,
                        scale: 1,
                        rotateX: 0,
                        filter: "blur(0px)",
                      }
                    : undefined
                }
                transition={
                  isNew
                    ? {
                        type: "spring",
                        stiffness: 150,
                        damping: 11,
                        mass: 1.05,
                      }
                    : undefined
                }
                style={{ transformPerspective: 1000 }}
                className="relative z-10"
              >
                <MoodCard
                  record={record}
                  tiltClassName={
                    isNew ? "-rotate-[2deg]" : TILTS[index % TILTS.length]
                  }
                  onOpen={(item) => {
                    // 正在飘走的卡片已从数据中移除，忽略它的点击
                    if (!records.some((entry) => entry.id === item.id)) {
                      return;
                    }

                    onDateClick?.(item.date);
                    setSelected(item);
                  }}
                />
              </motion.div>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>

      <FluidModal
        record={selected}
        onClose={() => setSelected(null)}
        onDeleted={onDelete}
      />
    </>
  );
}
