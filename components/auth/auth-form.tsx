'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signUp, signIn } from '@/lib/auth-client';
import { GraduationCap, BookUser, Loader2, AlertCircle } from 'lucide-react';

interface AuthFormProps {
  mode: 'signin' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        await signUp.email({
          email,
          password,
          name,
          role,
          callbackURL: role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard',
        });
      } else {
        await signIn.email({ email, password });
      }

      // Điều hướng theo vai trò thật của tài khoản (admin → trang quản trị).
      let realRole: string = role;
      try {
        const me = await fetch('/api/me').then((r) => (r.ok ? r.json() : null));
        if (me?.role) realRole = me.role;
      } catch {
        // dùng role mặc định nếu không lấy được
      }
      router.push(
        realRole === 'admin'
          ? '/admin'
          : realRole === 'teacher'
            ? '/teacher/dashboard'
            : '/student/dashboard'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  };

  const labelCls = 'mb-1.5 block text-sm font-medium text-foreground';

  return (
    <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-7 shadow-soft-lg animate-in-up">
      <h1 className="text-2xl font-bold">
        {mode === 'signin' ? 'Đăng nhập' : 'Tạo tài khoản'}
      </h1>
      <p className="mt-1.5 mb-6 text-sm text-muted-foreground">
        {mode === 'signin'
          ? 'Đăng nhập để tiếp tục sử dụng ExamHub.'
          : 'Tạo tài khoản mới để bắt đầu.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
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
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
          />
          {mode === 'signup' && (
            <p className="mt-1 text-xs text-muted-foreground">Tối thiểu 8 ký tự.</p>
          )}
        </div>

        {mode === 'signup' && (
          <div>
            <label className={labelCls}>Bạn là</label>
            <div className="grid grid-cols-2 gap-3">
              <RoleCard
                active={role === 'student'}
                onClick={() => setRole('student')}
                icon={<GraduationCap className="h-5 w-5" />}
                label="Học sinh"
              />
              <RoleCard
                active={role === 'teacher'}
                onClick={() => setRole('teacher')}
                icon={<BookUser className="h-5 w-5" />}
                label="Giáo viên"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading
            ? 'Đang xử lý...'
            : mode === 'signin'
              ? 'Đăng nhập'
              : 'Tạo tài khoản'}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-muted-foreground">
        {mode === 'signin' ? (
          <>
            Chưa có tài khoản?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Đăng ký
            </Link>
          </>
        ) : (
          <>
            Đã có tài khoản?{' '}
            <Link href="/signin" className="font-medium text-primary hover:underline">
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
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}