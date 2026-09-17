"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GraduationCap,
  BookUser,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

interface AuthFormProps {
  mode: "signin" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const hasRedirectedRef = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const endpoint =
        mode === "signup"
          ? "/api/auth/sign-up/email"
          : "/api/auth/sign-in/email";
      const payload = {
        email,
        password,
        ...(mode === "signup"
          ? {
              name,
              role,
            }
          : {}),
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          data?.error?.message ||
          (mode === "signin"
            ? "Email hoặc mật khẩu không đúng."
            : "Không thể tạo tài khoản. Vui lòng thử lại.");
        throw new Error(message);
      }

      const successMessage =
        mode === "signin"
          ? "Đăng nhập thành công. Đang chuyển hướng..."
          : "Tạo tài khoản thành công. Đang chuyển hướng...";
      setFeedback({ type: "success", message: successMessage });

      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        const redirectTo = new URLSearchParams(window.location.search).get(
          "redirectTo",
        );
        const targetRole = data?.user?.role || role;
        const defaultPath =
          targetRole === "admin"
            ? "/admin"
            : targetRole === "teacher"
              ? "/teacher/dashboard"
              : "/student/dashboard";
        const targetPath =
          redirectTo && redirectTo.startsWith("/") ? redirectTo : defaultPath;
        router.replace(targetPath);
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Xác thực thất bại",
      });
    } finally {
      setLoading(false);
    }
  };

  const labelCls = "mb-1.5 block text-sm font-medium text-foreground";

  return (
    <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-7 shadow-soft-lg animate-in-up">
      <h1 className="text-2xl font-bold">
        {mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
      </h1>
      <p className="mt-1.5 mb-6 text-sm text-muted-foreground">
        {mode === "signin"
          ? "Đăng nhập để tiếp tục sử dụng ExamHub."
          : "Tạo tài khoản mới để bắt đầu."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className={labelCls}>Họ và tên</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
            />
          </div>
        )}

        <div>
          <label className={labelCls}>Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@example.com"
            required
          />
        </div>

        <div>
          <label className={labelCls}>Mật khẩu</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {mode === "signup" && (
            <p className="mt-1 text-xs text-muted-foreground">
              Tối thiểu 8 ký tự.
            </p>
          )}
        </div>

        {mode === "signup" && (
          <div>
            <label className={labelCls}>Bạn là</label>
            <div className="grid grid-cols-2 gap-3">
              <RoleCard
                active={role === "student"}
                onClick={() => setRole("student")}
                icon={<GraduationCap className="h-5 w-5" />}
                label="Học sinh"
              />
              <RoleCard
                active={role === "teacher"}
                onClick={() => setRole("teacher")}
                icon={<BookUser className="h-5 w-5" />}
                label="Giáo viên"
              />
            </div>
          </div>
        )}

        {feedback && (
          <div
            className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-destructive/30 bg-destructive/5 text-destructive"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <Button
          type="submit"
          className="h-11 w-full text-base"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading
            ? "Đang xử lý..."
            : mode === "signin"
              ? "Đăng nhập"
              : "Tạo tài khoản"}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-muted-foreground">
        {mode === "signin" ? (
          <>
            Chưa có tài khoản?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary hover:underline"
            >
              Đăng ký
            </Link>
            <div className="mt-2">
              <Link
                href="/forgot-password"
                className="font-medium text-primary hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
          </>
        ) : (
          <>
            Đã có tài khoản?{" "}
            <Link
              href="/signin"
              className="font-medium text-primary hover:underline"
            >
              Đăng nhập
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm font-medium transition ${
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-primary/40"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
