'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Settings, ShieldCheck } from 'lucide-react';
import { Logo } from './logo';
import { NotificationBell } from './notification-bell';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from '@/lib/auth-client';
import type { ReactNode } from 'react';

export function AppHeader({ actions }: { actions?: ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as
    | { name?: string; email?: string; role?: string }
    | undefined;

  const isAdmin = user?.role === 'admin';
  const homeHref = isAdmin
    ? '/admin'
    : user?.role === 'teacher'
      ? '/teacher/dashboard'
      : user
        ? '/student/dashboard'
        : '/';

  const roleLabel = isAdmin
    ? 'Quản trị viên'
    : user?.role === 'teacher'
      ? 'Giáo viên'
      : 'Học sinh';

  const initial = (user?.name || user?.email || '?').charAt(0).toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      router.push('/signin');
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-header border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Logo href={homeHref} />

        <div className="flex items-center gap-2 sm:gap-3">
          {actions}

          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              {isAdmin && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Link href="/admin" title="Quản trị">
                    <ShieldCheck className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Quản trị</span>
                  </Link>
                </Button>
              )}
              <NotificationBell />
              <div className="hidden items-center gap-2.5 rounded-full border border-border/70 bg-card/60 py-1 pl-1 pr-3 sm:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
                  {initial}
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-medium">{user.name || 'Người dùng'}</p>
                  <p className="text-[11px] text-muted-foreground">{roleLabel}</p>
                </div>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href="/settings" title="Cài đặt">
                  <Settings className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Cài đặt</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}