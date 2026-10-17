import { InputCard } from "@/components/ui/InputCard";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-8 text-center">
      <div className="relative z-10 flex w-full flex-col items-center gap-6">
        <h1 className="text-balance text-5xl font-semibold tracking-tight text-zinc-900 sm:text-7xl">
          Fluid Mood
        </h1>
        <p className="max-w-md text-pretty text-base text-zinc-600 sm:text-lg">
          让情绪像流体一样流动、交叠，在光影与噪声之间找到属于你的节奏。
        </p>

        <InputCard className="mt-4" />
      </div>
    </main>
  );
}
 