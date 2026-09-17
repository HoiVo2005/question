"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/layout/logo";
import { PageLoading } from "@/components/layout/page-loading";

export default function SignUpPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      const role = (session.user as { role?: string }).role;
      router.replace(
        role === "teacher" ? "/teacher/dashboard" : "/student/dashboard",
      );
    }
  }, [session, isPending, router]);

  if (isPending || session?.user) {
    return <PageLoading />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center app-bg p-4">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Logo />
        <p className="text-sm text-muted-foreground">Nền tảng thi trực tuyến</p>
      </div>
      <AuthForm mode="signup" />
    </main>
  );
}
