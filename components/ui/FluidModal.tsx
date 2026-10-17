"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Trash2, X } from "lucide-react";

import type { EmotionRecord } from "@/utils/mockData";

type FluidModalProps = {
  record: EmotionRecord | null;
  onClose: () => void;
  /** 删除成功后通知父级移除该条记录 */
  onDeleted?: (id: number) => void;
};

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function FluidModal({ record, onClose, onDeleted }: FluidModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    if (!record?.id || deleting) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/moods/${record.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`删除情绪记录失败: ${response.status}`);
      }

      onDeleted?.(record.id);
      onClose();
    } catch (error) {
      console.error("删除情绪记录失败:", error);
      setDeleting(false);
    }
  };

  // 切换到另一条记录时重置删除状态
  useEffect(() => {
    setDeleting(false);
    setConfirming(false);
  }, [record?.id]);

  useEffect(() => {
    if (!record) {
      return;
    }

    const handleKeyDown = (event: KeyboardEventInit) => {
      if (event.key === "Escape") {
        if (confirming) {
          setConfirming(false);
          return;
        }

        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [record, onClose, confirming]);

  const date = record ? parseISO(record.date) : null;

  return (
    <AnimatePresence>
      {record && date ? (
        <motion.div
          key="journal-modal"
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* 温暖浅灰遮罩：让背后内容隐约可见 */}
          <button
            type="button"
            aria-label="关闭情绪手账"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-stone-800/20 backdrop-blur-md"
          />

          <div
            className="relative z-10 w-full max-w-md"
            style={{ perspective: "1600px" }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="情绪手账"
              className="origin-top"
              initial={{ opacity: 0, y: 40, rotateX: -78, scaleY: 0.16 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scaleY: 1 }}
              exit={{
                opacity: 0,
                y: 28,
                rotateX: 60,
                scaleY: 0.5,
                transition: { duration: 0.26, ease: "easeIn" },
              }}
              transition={{
                type: "spring",
                stiffness: 170,
                damping: 20,
                mass: 0.9,
              }}
            >
              {/* 信纸主体 */}
              <div className="relative flex min-h-[400px] max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-[#FDFBF7] shadow-2xl shadow-stone-200/50">
                {/* 纸张噪点 */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.28] mix-blend-multiply"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                    backgroundSize: "140px 140px",
                  }}
                />

                <div className="relative flex min-h-0 flex-1 flex-col px-8 pb-6 pt-12 sm:px-10 sm:pb-8 sm:pt-14">
                  {/* 顶部信息区：日期与标签居中，像杂志引言 */}
                  <motion.div
                    className="flex flex-col items-center gap-5 text-center"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: record.primaryColor }}
                      />
                      <p className="text-[10px] tracking-[0.3em] text-stone-400">
                        {format(date, "yyyy.MM.dd")} · 周
                        {WEEKDAYS[date.getDay()]}
                      </p>
                    </div>

                    {record.tags.length > 0 ? (
                      <div className="flex flex-wrap justify-center gap-2">
                        {record.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-stone-100/70 px-2.5 py-1 text-[10px] leading-none tracking-wide text-stone-500 ring-1 ring-inset ring-stone-200/60"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </motion.div>

                  {/* 极淡的短分隔线 */}
                  <motion.div
                    aria-hidden="true"
                    className="mx-auto mb-8 mt-8 w-12 border-t border-stone-200"
                    initial={{ opacity: 0, scaleX: 0.4 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
                  />

                  {/* 用户原本写下的内容 */}
                  <motion.p
                    className="-mr-5 min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap pr-5 text-justify text-[15px] leading-[2] tracking-[0.05em] text-stone-700 [scrollbar-color:#E7E5E4_transparent] [scrollbar-width:thin] sm:text-base [&::-webkit-scrollbar-thumb:hover]:bg-stone-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-200 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
                    style={{
                      fontFamily:
                        "'Noto Serif SC', 'Songti SC', SimSun, serif",
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.55, ease: "easeOut" }}
                  >
                    {record.text ?? record.echo}
                  </motion.p>

                  {/* 删除这条记录 */}
                  {record.id ? (
                    <motion.div
                      className="mt-6 flex justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.7,
                        ease: "easeOut",
                      }}
                    >
                      <button
                        type="button"
                        aria-label="删除这条情绪记录"
                        onClick={() => setConfirming(true)}
                        disabled={deleting}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] tracking-[0.2em] text-stone-400 transition-colors hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        {deleting ? "删除中..." : "删除这页"}
                      </button>
                    </motion.div>
                  ) : null}
                </div>

                {/* 极简关闭按钮 */}
                <button
                  type="button"
                  aria-label="关闭"
                  onClick={onClose}
                  className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-900/5 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* 删除二次确认：一张更小的纸签，保持留白与克制 */}
          <AnimatePresence>
            {confirming ? (
              <motion.div
                key="delete-confirm"
                className="fixed inset-0 z-[60] flex items-center justify-center px-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  type="button"
                  aria-label="取消删除"
                  onClick={() => setConfirming(false)}
                  className="absolute inset-0 cursor-default bg-stone-800/10 backdrop-blur-[2px]"
                />

                <motion.div
                  role="alertdialog"
                  aria-modal="true"
                  aria-label="确认删除这条记录"
                  className="relative w-full max-w-[18rem] rounded-2xl border border-stone-200 bg-[#FDFBF7] px-6 py-6 text-center shadow-2xl shadow-stone-300/40"
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.18] mix-blend-multiply"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                      backgroundSize: "140px 140px",
                    }}
                  />

                  <div className="relative">
                    <p className="text-[13px] leading-relaxed tracking-[0.05em] text-stone-600">
                      确定要删除这页手记吗？
                    </p>
                    <p className="mt-1.5 text-[11px] tracking-wide text-stone-400">
                      删除后将无法找回。
                    </p>

                    <div className="mt-7 flex items-center justify-center gap-5">
                      <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        disabled={deleting}
                        className="rounded-full px-2 py-1 text-[11px] tracking-[0.2em] text-stone-400 transition-colors hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 disabled:opacity-50"
                      >
                        取消
                      </button>
                      <span
                        aria-hidden="true"
                        className="h-3 w-px bg-stone-200"
                      />
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="rounded-full px-2 py-1 text-[11px] tracking-[0.2em] text-stone-500 transition-colors hover:text-[#B0715B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deleting ? "删除中..." : "删除"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
