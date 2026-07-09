import { AuthForm } from '@/components/auth/auth-form';
import { Logo } from '@/components/layout/logo';

export default function SignUpPage() {
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