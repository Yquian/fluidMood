"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

export function SiteNav() {
  const pathname = usePathname();

  // 画廊页本身已有标题与返回入口，避免重复
  if (pathname === "/gallery") return null;

  return (
    <nav
      aria-label="全局导航"
      className="fixed right-6 top-6 z-50 sm:right-8 sm:top-8"
    >
      <Link
        href="/gallery"
        className="inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.22em] text-zinc-500 transition-colors duration-300 hover:text-zinc-900 focus-visible:outline-none focus-visible:text-zinc-900"
      >
        <Sparkles
          className="h-3.5 w-3.5"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        情绪画廊
      </Link>
    </nav>
  );
}
