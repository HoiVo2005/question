'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { toast, notify, confirmAction, confirmDelete } from '@/lib/swal';
import {
  PLAN_LABELS,
  formatVnd,
  type BillingCycle,
  type PlanId,
} from '@/lib/plans';
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Clock,
  Crown,
  RefreshCw,
  Users,
  LayoutDashboard,
  CreditCard,
  Search,
  Trash2,
  GraduationCap,
  BookUser,
  FileText,
  DollarSign,
} from 'lucide-react';

type Tab = 'overview' | 'users' | 'payments' | 'plans';

interface Stats {
  users: { total: number; teachers: number; students: number; admins: number };
  content: { examSets: number; exams: number; submissions: number; classrooms: number };
  billing: { activeSubs: number; pendingOrders: number; revenue: number; paidCount: number };
}
interface AdminUser {
  id: string;
  name: string | null;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
  subscription: { plan: PlanId; expires_at: string | null } | null;
}
interface PayOrder {
  id: string;
  plan: PlanId;
  cycle: BillingCycle;
  amount: number;
  transfer_code: string;
  status: string;
  user: { name: string; email: string };
}
interface Sub {
  user_id: string;
  plan: PlanId;
  cycle: BillingCycle;
  status: string;
  expires_at: string | null;
  user: { name: string; email: string };
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Quản trị viên',
  teacher: 'Giáo viên',
  student: 'Học sinh',
};

export default function AdminPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<PayOrder[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);

  // Form cấp / gia hạn gói thủ công.
  const [gEmail, setGEmail] = useState('');
  const [gPlan, setGPlan] = useState<Exclude<PlanId, 'free'>>('max');
  const [gCycle, setGCycle] = useState<BillingCycle>('monthly');
  const [gDays, setGDays] = useState('');
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.push('/signin');
      return;
    }
    (async () => {
      const data = await fetch('/api/subscription').then((r) => r.json());
      if (!data.isAdmin) {
        setAuthorized(false);
        return;
      }
      setAuthorized(true);
    })();
  }, [session, isPending]);

  const loadStats = useCallback(async () => {
    const d = await fetch('/api/admin/stats').then((r) => r.json());
    if (!d.error) setStats(d);
  }, []);
  const loadUsers = useCallback(async () => {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (roleFilter !== 'all') qs.set('role', roleFilter);
    const d = await fetch(`/api/admin/users?${qs}`).then((r) => r.json());
    setUsers(d.users || []);
  }, [search, roleFilter]);
  const loadPayments = useCallback(async () => {
    const d = await fetch('/api/admin/payments?status=open').then((r) => r.json());
    setOrders(d.orders || []);
  }, []);
  const loadSubs = useCallback(async () => {
    const d = await fetch('/api/admin/subscriptions').then((r) => r.json());
    setSubs(d.subscriptions || []);
  }, []);

  useEffect(() => {
    if (!authorized) return;
    if (tab === 'overview') loadStats();
    if (tab === 'users') loadUsers();
    if (tab === 'payments') loadPayments();
    if (tab === 'plans') {
      loadSubs();
      loadPayments();
    }
  }, [authorized, tab, loadStats, loadUsers, loadPayments, loadSubs]);

  // ---- Actions ----
  const confirmOrder = async (o: PayOrder) => {
    const ok = await confirmAction({
      title: 'Xác nhận đã nhận tiền?',
      text: `Kích hoạt ${PLAN_LABELS[o.plan]} cho ${o.user.email} (${formatVnd(o.amount)}).`,
      confirmText: 'Xác nhận',
    });
    if (!ok) return;
    setBusy(o.id);
    try {
      const res = await fetch(`/api/admin/payments/${o.id}/confirm`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error || 'Lỗi');
      await toast('Đã kích hoạt gói');
      await Promise.all([loadPayments(), loadSubs(), loadStats()]);
    } catch (err) {
      await notify(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  const changeRole = async (u: AdminUser, role: string) => {
    if (role === u.role) return;
    setBusy(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Lỗi');
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
      await toast('Đã đổi vai trò');
    } catch (err) {
      await notify(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  const deleteUser = async (u: AdminUser) => {
    const ok = await confirmDelete({
      title: 'Xoá người dùng?',
      text: `Xoá ${u.email} và toàn bộ dữ liệu liên quan. Không thể hoàn tác.`,
      confirmText: 'Xoá',
    });
    if (!ok) return;
    setBusy(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Lỗi');
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      await toast('Đã xoá người dùng');
    } catch (err) {
      await notify(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  const revoke = async (s: Sub) => {
    const ok = await confirmDelete({
      title: 'Thu hồi gói?',
      text: `Đưa ${s.user.email} về gói Miễn phí.`,
      confirmText: 'Thu hồi',
    });
    if (!ok) return;
    setBusy(s.user_id);
    try {
      const res = await fetch(`/api/admin/subscriptions/${s.user_id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Lỗi');
      await toast('Đã thu hồi gói');
      await Promise.all([loadSubs(), loadStats()]);
    } catch (err) {
      await notify(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  const grant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gEmail.trim()) {
      await notify('Nhập email giáo viên.', 'warning');
      return;
    }
    setGranting(true);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: gEmail.trim(),
          plan: gPlan,
          cycle: gCycle,
          days: gDays ? Number(gDays) : undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Lỗi');
      await notify(
        `Đã cấp ${PLAN_LABELS[gPlan]} đến ${new Date(
          d.subscription.expiresAt
        ).toLocaleDateString('vi-VN')}.`,
        'success'
      );
      setGEmail('');
      setGDays('');
      await Promise.all([loadSubs(), loadStats()]);
    } catch (err) {
      await notify(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setGranting(false);
    }
  };

  if (isPending || authorized === null) return <PageLoading />;
  if (authorized === false) {
    return (
      <main className="min-h-screen app-bg">
        <AppHeader />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-3 text-xl font-bold">Không có quyền truy cập</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trang quản trị chỉ dành cho tài khoản có vai trò admin.
          </p>
        </div>
      </main>
    );
  }

  const inputCls =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40';
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Tổng quan', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'users', label: 'Người dùng', icon: <Users className="h-4 w-4" /> },
    { id: 'payments', label: 'Thanh toán', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'plans', label: 'Gói đăng ký', icon: <Crown className="h-4 w-4" /> },
  ];

  return (
    <main className="min-h-screen app-bg">
      <AppHeader />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Bảng điều khiển Quản trị</h1>
            <p className="text-sm text-muted-foreground">
              Quản lý người dùng, phân quyền, thanh toán và gói đăng ký toàn hệ thống
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-border/70 bg-card p-1 shadow-soft">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ---------- TỔNG QUAN ---------- */}
        {tab === 'overview' &&
          (!stats ? (
            <SectionLoading />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat icon={<Users />} color="from-indigo-500 to-violet-600" label="Tổng người dùng" value={stats.users.total} />
                <Stat icon={<BookUser />} color="from-sky-500 to-cyan-500" label="Giáo viên" value={stats.users.teachers} />
                <Stat icon={<GraduationCap />} color="from-emerald-500 to-teal-500" label="Học sinh" value={stats.users.students} />
                <Stat icon={<ShieldCheck />} color="from-amber-500 to-orange-500" label="Admin" value={stats.users.admins} />
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat icon={<FileText />} color="from-violet-500 to-purple-600" label="Ngân hàng đề" value={stats.content.examSets} />
                <Stat icon={<FileText />} color="from-blue-500 to-indigo-500" label="Bài thi" value={stats.content.exams} />
                <Stat icon={<CheckCircle2 />} color="from-green-500 to-emerald-500" label="Lượt nộp bài" value={stats.content.submissions} />
                <Stat icon={<Users />} color="from-pink-500 to-rose-500" label="Lớp học" value={stats.content.classrooms} />
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat icon={<Crown />} color="from-amber-500 to-yellow-500" label="Gói đang hiệu lực" value={stats.billing.activeSubs} />
                <Stat icon={<Clock />} color="from-orange-500 to-red-500" label="Đơn chờ duyệt" value={stats.billing.pendingOrders} />
                <Stat icon={<CheckCircle2 />} color="from-teal-500 to-cyan-600" label="Đơn đã thu" value={stats.billing.paidCount} />
                <Stat icon={<DollarSign />} color="from-emerald-600 to-green-600" label="Doanh thu" value={formatVnd(stats.billing.revenue)} />
              </div>
            </div>
          ))}

        {/* ---------- NGƯỜI DÙNG ---------- */}
        {tab === 'users' && (
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={`${inputCls} pl-9`}
                  placeholder="Tìm theo tên hoặc email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                />
              </div>
              <select
                className={`${inputCls} sm:w-44`}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">Tất cả vai trò</option>
                <option value="admin">Quản trị viên</option>
                <option value="teacher">Giáo viên</option>
                <option value="student">Học sinh</option>
              </select>
              <Button variant="outline" onClick={loadUsers}>
                <Search className="mr-1.5 h-4 w-4" /> Tìm
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Người dùng</th>
                    <th className="py-2 pr-4 font-medium">Vai trò</th>
                    <th className="py-2 pr-4 font-medium">Gói</th>
                    <th className="py-2 pr-4 font-medium">Tham gia</th>
                    <th className="py-2 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Không có người dùng.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="border-b border-border/50">
                        <td className="py-2.5 pr-4">
                          <p className="font-medium">{u.name || u.full_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </td>
                        <td className="py-2.5 pr-4">
                          <select
                            className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                            value={u.role}
                            disabled={busy === u.id || u.id === session?.user?.id}
                            onChange={(e) => changeRole(u, e.target.value)}
                          >
                            <option value="student">Học sinh</option>
                            <option value="teacher">Giáo viên</option>
                            <option value="admin">Quản trị viên</option>
                          </select>
                        </td>
                        <td className="py-2.5 pr-4">
                          {u.subscription ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                              {PLAN_LABELS[u.subscription.plan]}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Free</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString('vi-VN')
                            : '—'}
                        </td>
                        <td className="py-2.5 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            disabled={busy === u.id || u.id === session?.user?.id}
                            onClick={() => deleteUser(u)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------- THANH TOÁN ---------- */}
        {tab === 'payments' && (
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Clock className="h-4 w-4 text-amber-500" /> Đơn chờ xác nhận ({orders.length})
              </h2>
              <Button variant="outline" size="sm" onClick={loadPayments}>
                <RefreshCw className="mr-1.5 h-4 w-4" /> Làm mới
              </Button>
            </div>
            {orders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Không có đơn nào đang chờ.
              </p>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{PLAN_LABELS[o.plan]}</span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                          {o.transfer_code}
                        </span>
                        {o.status === 'awaiting' && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            Khách báo đã CK
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {o.user.name || o.user.email} · {o.user.email} ·{' '}
                        <b className="text-foreground">{formatVnd(o.amount)}</b> ·{' '}
                        {o.cycle === 'yearly' ? 'theo năm' : 'theo tháng'}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => confirmOrder(o)} disabled={busy === o.id}>
                      {busy === o.id ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      )}
                      Đã nhận tiền
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------- GÓI ĐĂNG KÝ ---------- */}
        {tab === 'plans' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
              <h2 className="mb-1 flex items-center gap-2 font-semibold">
                <Crown className="h-4 w-4 text-amber-500" /> Cấp / gia hạn gói thủ công
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Dùng cho gói MAX (Liên hệ) hoặc gia hạn cho khách doanh nghiệp.
              </p>
              <form onSubmit={grant} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="mb-1 block text-sm font-medium">Email giáo viên</label>
                  <input
                    className={inputCls}
                    value={gEmail}
                    onChange={(e) => setGEmail(e.target.value)}
                    placeholder="teacher@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Gói</label>
                  <select
                    className={inputCls}
                    value={gPlan}
                    onChange={(e) => setGPlan(e.target.value as Exclude<PlanId, 'free'>)}
                  >
                    <option value="plus">PLUS</option>
                    <option value="pro">PRO</option>
                    <option value="max">MAX</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Chu kỳ</label>
                  <select
                    className={inputCls}
                    value={gCycle}
                    onChange={(e) => setGCycle(e.target.value as BillingCycle)}
                  >
                    <option value="monthly">Theo tháng</option>
                    <option value="yearly">Theo năm</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Số ngày (tuỳ chọn)</label>
                  <input
                    className={inputCls}
                    value={gDays}
                    onChange={(e) => setGDays(e.target.value.replace(/\D/g, ''))}
                    placeholder="vd: 365"
                    inputMode="numeric"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <Button type="submit" disabled={granting}>
                    {granting ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Đang cấp...
                      </>
                    ) : (
                      <>
                        <Crown className="mr-1.5 h-4 w-4" /> Cấp / gia hạn
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
              <h2 className="mb-4 font-semibold">Gói đang hoạt động ({subs.length})</h2>
              {subs.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Chưa có gói trả phí nào.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Giáo viên</th>
                        <th className="py-2 pr-4 font-medium">Gói</th>
                        <th className="py-2 pr-4 font-medium">Chu kỳ</th>
                        <th className="py-2 pr-4 font-medium">Hết hạn</th>
                        <th className="py-2 pr-4 font-medium">Trạng thái</th>
                        <th className="py-2 font-medium text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subs.map((s) => {
                        const expired =
                          s.status === 'expired' ||
                          (s.expires_at != null &&
                            new Date(s.expires_at).getTime() < Date.now());
                        return (
                          <tr key={s.user_id} className="border-b border-border/50">
                            <td className="py-2.5 pr-4">
                              {s.user.name || '—'}
                              <span className="block text-xs text-muted-foreground">
                                {s.user.email}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 font-semibold">
                              {PLAN_LABELS[s.plan]}
                            </td>
                            <td className="py-2.5 pr-4">
                              {s.cycle === 'yearly' ? 'Năm' : 'Tháng'}
                            </td>
                            <td className="py-2.5 pr-4">
                              {s.expires_at
                                ? new Date(s.expires_at).toLocaleDateString('vi-VN')
                                : '—'}
                            </td>
                            <td className="py-2.5 pr-4">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  expired
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {expired ? 'Hết hạn' : 'Hiệu lực'}
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10"
                                disabled={busy === s.user_id}
                                onClick={() => revoke(s)}
                              >
                                Thu hồi
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({
  icon,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white [&_svg]:h-5 [&_svg]:w-5`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xl font-bold leading-none">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function SectionLoading() {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-12 text-center text-muted-foreground shadow-soft">
      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
    </div>
  );
}
