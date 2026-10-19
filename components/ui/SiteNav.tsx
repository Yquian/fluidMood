"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";

export function SiteNav() {
  const pathname = usePathname();
  const { user, status, openAuthModal, logout } = useAuth();

  // 画廊页本身已有标题与返回入口，仅隐藏重复的入口，用户区始终保留
  const showGalleryLink = pathname !== "/gallery";

  return (
    <nav
      aria-label="全局导航"
      className="fixed right-6 top-6 z-50 sm:right-8 sm:top-8"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {showGalleryLink ? (
          <Link
            href="/gallery"
            onClick={(event) => {
              // 未登录时先登录，不直接跳转
              if (status !== "authenticated") {
                event.preventDefault();
                openAuthModal();
              }
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium tracking-[0.22em] text-zinc-500 transition-colors duration-300 hover:text-zinc-900 focus-visible:outline-none focus-visible:text-zinc-900"
          >
            <Sparkles
              className="h-4 w-4"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            情绪画廊
          </Link>
        ) : null}

        {showGalleryLink ? (
          <span aria-hidden="true" className="h-3 w-px bg-zinc-300/70" />
        ) : null}

        {status === "loading" ? (
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-300"
          />
        ) : user ? (
          <div className="flex items-center gap-2">
            <span className="max-w-[9rem] truncate text-sm font-medium tracking-[0.12em] text-zinc-700">
              {user.username}
            </span>
            <button
              type="button"
              aria-label="退出登录"
              title="退出登录"
              onClick={() => void logout()}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors duration-300 hover:bg-zinc-900/5 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={openAuthModal}
            className="text-xs font-medium tracking-[0.22em] text-zinc-500 transition-colors duration-300 hover:text-zinc-900 focus-visible:outline-none focus-visible:text-zinc-900"
          >
            登录
          </button>
        )}
      </div>
    </nav>
  );
}
