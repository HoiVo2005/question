'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import { authClient, useSession } from '@/lib/auth-client';
import { notify, toast, confirmDelete } from '@/lib/swal';
import { UpgradeModal } from '@/components/billing/upgrade-modal';
import { usePlan } from '@/lib/hooks/use-plan';
import { PLAN_LABELS, PLANS } from '@/lib/plans';
import {
  User,
  Mail,
  Shield,
  School,
  KeyRound,
  Save,
  Loader2,
  Trash2,
  AlertTriangle,
  Crown,
} from 'lucide-react';

interface Me {
  name: string;
  email: string;
  role: string;
  classes: { name: string; code: string }[];
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { plan, cycle, expiresAt, isAdmin } = usePlan();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const [delPw, setDelPw] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.push('/signin');
      return;
    }
    (async () => {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setMe(data);
        setName(data.name || '');
      }
    })();
  }, [session, isPending]);

  if (isPending || !me) return <PageLoading />;

  const inputCls =
    'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40';
  const readonlyCls =
    'w-full rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground';
  const labelCls =
    'mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground';

  const selfNotify = async (title: string, body: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, type: 'account' }),
      });
    } catch {
      // bỏ qua lỗi thông báo
    }
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      await notify('Vui lòng nhập họ tên.', 'warning');
      return;
    }
    setSavingName(true);
    try {
      const { error } = await authClient.updateUser({ name: name.trim() });
      if (error) throw new Error(error.message || 'Cập nhật thất bại');
      await selfNotify('Đã cập nhật thông tin', 'Họ tên tài khoản của bạn vừa được thay đổi.');
      await toast('Đã lưu thông tin');
    } catch (err) {
      await notify(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) {
      await notify('Mật khẩu mới phải có ít nhất 8 ký tự.', 'warning');
      return;
    }
    if (newPw !== newPw2) {
      await notify('Mật khẩu xác nhận không khớp.', 'warning');
      return;
    }
    setSavingPw(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: curPw,
        newPassword: newPw,
        revokeOtherSessions: true,
      });
      if (error) throw new Error(error.message || 'Đổi mật khẩu thất bại');
      setCurPw('');
      setNewPw('');
      setNewPw2('');
      await selfNotify('Đã đổi mật khẩu', 'Mật khẩu tài khoản của bạn vừa được thay đổi.');
      await notify('Đổi mật khẩu thành công.', 'success');
    } catch (err) {
      await notify(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSavingPw(false);
    }
  };

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delPw) {
      await notify('Vui lòng nhập mật khẩu để xác nhận xoá.', 'warning');
      return;
    }
    const ok = await confirmDelete({
      title: 'Xoá tài khoản vĩnh viễn?',
      text: 'Toàn bộ dữ liệu của bạn sẽ bị xoá và không thể khôi phục.',
      confirmText: 'Xoá tài khoản',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      const { error } = await authClient.deleteUser({ password: delPw });
      if (error) throw new Error(error.message || 'Xoá tài khoản thất bại');
      await notify('Tài khoản đã được xoá.', 'success');
      router.push('/signin');
    } catch (err) {
      await notify(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen app-bg">
      <AppHeader />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
            <User className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cài đặt tài khoản</h1>
            <p className="text-sm text-muted-foreground">
              Quản lý thông tin, mật khẩu và tài khoản
            </p>
          </div>
        </div>

        {/* Thông tin */}
        <form
          onSubmit={saveName}
          className="mb-6 space-y-4 rounded-2xl border border-border/70 bg-card p-6 shadow-soft"
        >
          <h2 className="font-semibold">Thông tin cá nhân</h2>
          <div>
            <label className={labelCls}>
              <User className="h-4 w-4" /> Họ và tên
            </label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Họ và tên"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>
                <Mail className="h-4 w-4" /> Email
              </label>
              <input className={readonlyCls} value={me.email} disabled readOnly />
            </div>
            <div>
              <label className={labelCls}>
                <Shield className="h-4 w-4" /> Vai trò
              </label>
              <input
                className={readonlyCls}
                value={
                  me.role === 'admin'
                    ? 'Quản trị viên'
                    : me.role === 'teacher'
                      ? 'Giáo viên'
                      : 'Học sinh'
                }
                disabled
                readOnly
              />
            </div>
          </div>
          {me.role !== 'teacher' && (
            <div>
              <label className={labelCls}>
                <School className="h-4 w-4" /> Lớp
              </label>
              <input
                className={readonlyCls}
                value={
                  me.classes.length
                    ? me.classes.map((c) => c.name).join(', ')
                    : 'Chưa thuộc lớp nào'
                }
                disabled
                readOnly
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Email, vai trò{me.role !== 'teacher' ? ' và lớp' : ''} không thể thay đổi.
          </p>
          <Button type="submit" disabled={savingName}>
            {savingName ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" /> Lưu thông tin
              </>
            )}
          </Button>
        </form>

        {/* Gói & Thanh toán (chỉ giáo viên) */}
        {me.role === 'teacher' && (
          <div className="mb-6 space-y-4 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            <h2 className="flex items-center gap-2 font-semibold">
              <Crown className="h-4 w-4 text-amber-500" /> Gói & Thanh toán
            </h2>
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2">
                  <span className="text-lg font-bold">Gói {PLAN_LABELS[plan]}</span>
                  {plan !== 'free' && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      Đang hoạt động
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan === 'free'
                    ? 'Bạn đang dùng gói miễn phí với tính năng cơ bản.'
                    : `${PLANS[plan].tagline} · Thanh toán ${
                        cycle === 'yearly' ? 'hàng năm' : 'hàng tháng'
                      }.`}
                </p>
                {plan !== 'free' && expiresAt && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Hiệu lực đến{' '}
                    <b className="text-foreground">
                      {new Date(expiresAt).toLocaleDateString('vi-VN')}
                    </b>
                  </p>
                )}
              </div>
              <Button onClick={() => setUpgradeOpen(true)}>
                <Crown className="mr-1.5 h-4 w-4" />
                {plan === 'free' ? 'Nâng cấp gói' : 'Gia hạn / Đổi gói'}
              </Button>
            </div>
            {isAdmin && (
              <a
                href="/admin"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Shield className="h-4 w-4" /> Mở trang quản trị thanh toán
              </a>
            )}
          </div>
        )}

        {/* Đổi mật khẩu */}
        <form
          onSubmit={changePassword}
          className="mb-6 space-y-4 rounded-2xl border border-border/70 bg-card p-6 shadow-soft"
        >
          <h2 className="flex items-center gap-2 font-semibold">
            <KeyRound className="h-4 w-4 text-primary" /> Đổi mật khẩu
          </h2>
          <div>
            <label className={labelCls}>Mật khẩu hiện tại</label>
            <input
              type="password"
              className={inputCls}
              value={curPw}
              onChange={(e) => setCurPw(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Mật khẩu mới</label>
              <input
                type="password"
                className={inputCls}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
              />
            </div>
            <div>
              <label className={labelCls}>Xác nhận mật khẩu mới</label>
              <input
                type="password"
                className={inputCls}
                value={newPw2}
                onChange={(e) => setNewPw2(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={savingPw} variant="outline">
            {savingPw ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Đang đổi...
              </>
            ) : (
              'Đổi mật khẩu'
            )}
          </Button>
        </form>

        {/* Xoá tài khoản */}
        <form
          onSubmit={deleteAccount}
          className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 shadow-soft"
        >
          <h2 className="flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" /> Xoá tài khoản
          </h2>
          <p className="text-sm text-muted-foreground">
            Hành động này không thể hoàn tác. Nhập mật khẩu để xác nhận xoá tài khoản.
          </p>
          <div>
            <label className={labelCls}>Mật khẩu</label>
            <input
              type="password"
              className={inputCls}
              value={delPw}
              onChange={(e) => setDelPw(e.target.value)}
              placeholder="Nhập mật khẩu để xoá"
            />
          </div>
          <Button
            type="submit"
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Đang xoá...
              </>
            ) : (
              <>
                <Trash2 className="mr-1.5 h-4 w-4" /> Xoá tài khoản
              </>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
