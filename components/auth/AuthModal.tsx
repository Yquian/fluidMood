"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, X } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

type Mode = "login" | "register";

const NOISE_BACKGROUND =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const FIELD_CLASS =
  "w-full rounded-xl border border-stone-200 bg-white/60 px-4 py-2.5 text-sm text-stone-700 shadow-inner shadow-stone-100/50 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-300 focus:bg-white/80 focus:ring-2 focus:ring-stone-200/70";

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 每次重新打开或切换模式都回到干净状态
  useEffect(() => {
    if (open) {
      setMode("login");
      setUsername("");
      setPassword("");
      setConfirm("");
      setError("");
      setPending(false);
      setShowPassword(false);
      setShowConfirm(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
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
  }, [open, onClose]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setPassword("");
    setConfirm("");
    setError("");
    setShowPassword(false);
    setShowConfirm(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    const name = username.trim();
    if (!name || !password) {
      setError("请填写用户名和密码");
      return;
    }

    if (mode === "register") {
      if (password.length < 6) {
        setError("密码至少需要 6 位");
        return;
      }
      if (password !== confirm) {
        setError("两次输入的密码不一致");
        return;
      }
    }

    setPending(true);
    setError("");

    try {
      if (mode === "login") {
        await login(name, password);
      } else {
        await register(name, password);
      }
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "操作失败，请稍后再试"
      );
      setPending(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="auth-modal"
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            type="button"
            aria-label="关闭登录注册弹窗"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-stone-800/25 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={mode === "login" ? "登录" : "注册"}
            className="relative z-10 w-full max-w-sm"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-[#FDFBF7] px-7 py-8 shadow-2xl shadow-stone-300/50 sm:px-8">
              {/* 纸张噪点，与手账弹窗保持同一质感 */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.25] mix-blend-multiply"
                style={{
                  backgroundImage: NOISE_BACKGROUND,
                  backgroundSize: "140px 140px",
                }}
              />

              <button
                type="button"
                aria-label="关闭"
                onClick={onClose}
                className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-900/5 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative">
                <div className="text-center">
                  <h2
                    className="text-lg font-medium tracking-[0.22em] text-stone-800"
                    style={{
                      fontFamily: "'Noto Serif SC', 'Songti SC', SimSun, serif",
                    }}
                  >
                    Fluid Mood
                  </h2>
                  <p className="mt-1.5 text-[11px] tracking-[0.18em] text-stone-400">
                    {mode === "login" ? "登录后继续记录心情" : "创建一个新账号"}
                  </p>
                </div>

                {/* 登录 / 注册切换 */}
                <div className="mt-6 flex items-center justify-center gap-6">
                  {(["login", "register"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => switchMode(item)}
                      className={`relative pb-1.5 text-xs tracking-[0.2em] transition-colors ${
                        mode === item
                          ? "text-stone-800"
                          : "text-stone-400 hover:text-stone-600"
                      }`}
                    >
                      {item === "login" ? "登录" : "注册"}
                      {mode === item ? (
                        <motion.span
                          layoutId="auth-tab-underline"
                          className="absolute inset-x-0 -bottom-px h-px bg-stone-400"
                        />
                      ) : null}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3.5">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] tracking-[0.18em] text-stone-400">
                      用户名
                    </span>
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      autoComplete="username"
                      placeholder="2-20 个字符"
                      className={FIELD_CLASS}
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] tracking-[0.18em] text-stone-400">
                      密码
                    </span>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete={
                          mode === "login" ? "current-password" : "new-password"
                        }
                        placeholder="至少 6 位"
                        className={`${FIELD_CLASS} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "隐藏密码" : "显示密码"}
                        title={showPassword ? "隐藏密码" : "显示密码"}
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 transition-colors hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                        ) : (
                          <Eye className="h-4 w-4" strokeWidth={1.75} />
                        )}
                      </button>
                    </div>
                  </label>

                  {mode === "register" ? (
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] tracking-[0.18em] text-stone-400">
                        确认密码
                      </span>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirm}
                          onChange={(event) => setConfirm(event.target.value)}
                          autoComplete="new-password"
                          placeholder="再次输入密码"
                          className={`${FIELD_CLASS} pr-11`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((prev) => !prev)}
                          aria-label={showConfirm ? "隐藏密码" : "显示密码"}
                          title={showConfirm ? "隐藏密码" : "显示密码"}
                          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 transition-colors hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
                        >
                          {showConfirm ? (
                            <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                          ) : (
                            <Eye className="h-4 w-4" strokeWidth={1.75} />
                          )}
                        </button>
                      </div>
                    </label>
                  ) : null}

                  {error ? (
                    <p
                      role="alert"
                      className="text-center text-[11px] tracking-wide text-[#B0715B]"
                    >
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={pending || !username.trim() || !password}
                    className="mt-2 h-11 rounded-full border-none bg-white/60 text-xs font-medium tracking-[0.25em] text-stone-700 shadow-[0_10px_30px_-12px_rgba(24,24,27,0.28)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_40px_-14px_rgba(24,24,27,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                  >
                    {pending
                      ? mode === "login"
                        ? "登录中..."
                        : "注册中..."
                      : mode === "login"
                        ? "登录"
                        : "注册"}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
