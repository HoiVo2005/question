'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { toast, notify } from '@/lib/swal';
import { formatVnd, type BillingCycle, type PlanId } from '@/lib/plans';
import {
  Copy,
  Loader2,
  CheckCircle2,
  Clock,
  Building2,
  AlertTriangle,
} from 'lucide-react';

interface Order {
  id: string;
  plan: PlanId;
  planName: string;
  cycle: BillingCycle;
  amount: number;
  transferCode: string;
  status: string;
}

interface Account {
  bankId: string;
  accountNo: string;
  accountName: string;
  configured: boolean;
}

function CheckoutInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, isPending } = useSession();
  const plan = (params.get('plan') || 'plus') as PlanId;
  const cycle = (params.get('cycle') || 'monthly') as BillingCycle;

  const [order, setOrder] = useState<Order | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const created = useRef(false);

  // Tạo đơn 1 lần khi vào trang.
  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.push('/signin');
      return;
    }
    if (created.current) return;
    created.current = true;
    (async () => {
      try {
        const res = await fetch('/api/teacher/billing/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, cycle }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Không tạo được đơn');
        setOrder(data.order);
        setQrUrl(data.qrUrl);
        setAccount(data.account);
      } catch (err) {
        await notify(err instanceof Error ? err.message : String(err), 'error');
        router.push('/teacher/dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [session, isPending]);

  // Poll trạng thái đơn để bắt thời điểm admin xác nhận.
  useEffect(() => {
    if (!order || order.status === 'paid') return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/teacher/billing/orders/${order.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.order?.status && data.order.status !== order.status) {
          setOrder((o) => (o ? { ...o, status: data.order.status } : o));
        }
        if (data.order?.status === 'paid') {
          clearInterval(timer);
          await toast('Thanh toán thành công! Gói đã được kích hoạt.');
          router.push('/teacher/dashboard');
        }
      } catch {
        // bỏ qua lỗi mạng tạm thời
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [order?.id, order?.status]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      await toast(`Đã sao chép ${label}`);
    } catch {
      // trình duyệt chặn clipboard
    }
  };

  const markPaid = async () => {
    if (!order) return;
    setMarking(true);
    try {
      const res = await fetch(`/api/teacher/billing/orders/${order.id}`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra');
      setOrder((o) => (o ? { ...o, status: data.status } : o));
    } catch (err) {
      await notify(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setMarking(false);
    }
  };

  if (isPending || loading) return <PageLoading />;
  if (!order) return null;

  const paid = order.status === 'paid';
  const awaiting = order.status === 'awaiting';

  return (
    <main className="min-h-screen app-bg">
      <AppHeader />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Thanh toán gói {order.planName}</h1>
        <p className="mt-1 text-muted-foreground">
          Chuyển khoản đúng số tiền và nội dung bên dưới. Gói sẽ được kích hoạt ngay
          sau khi quản trị viên xác nhận nhận được tiền.
        </p>

        {paid ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-3 text-xl font-bold text-emerald-800">
              Đã kích hoạt gói {order.planName}!
            </h2>
            <Button asChild className="mt-5">
              <Link href="/teacher/dashboard">Về trang chính</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* QR */}
            <div className="rounded-2xl border border-border/70 bg-card p-6 text-center shadow-soft">
              <h2 className="mb-4 font-semibold">Quét mã QR để chuyển khoản</h2>
              {account?.configured && qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt="VietQR"
                  className="mx-auto w-full max-w-[260px] rounded-lg border border-border"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-700">
                  <AlertTriangle className="h-6 w-6" />
                  Chưa cấu hình tài khoản nhận tiền. Vui lòng nhập thông tin{' '}
                  <code className="font-mono">PAYMENT_*</code> trong .env rồi tải lại.
                </div>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                Dùng app ngân hàng bất kỳ quét mã (đã điền sẵn số tiền & nội dung).
              </p>
            </div>

            {/* Thông tin chuyển khoản */}
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Building2 className="h-4 w-4 text-primary" /> Hoặc chuyển khoản thủ công
              </h2>
              <dl className="space-y-3 text-sm">
                <Row label="Ngân hàng" value={account?.bankId || '—'} />
                <Row
                  label="Số tài khoản"
                  value={account?.accountNo || '—'}
                  onCopy={
                    account?.accountNo
                      ? () => copy(account.accountNo, 'số tài khoản')
                      : undefined
                  }
                />
                <Row label="Chủ tài khoản" value={account?.accountName || '—'} />
                <Row
                  label="Số tiền"
                  value={formatVnd(order.amount)}
                  highlight
                  onCopy={() => copy(String(order.amount), 'số tiền')}
                />
                <Row
                  label="Nội dung CK"
                  value={order.transferCode}
                  highlight
                  onCopy={() => copy(order.transferCode, 'nội dung')}
                />
              </dl>
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                ⚠️ Bắt buộc ghi đúng nội dung <b>{order.transferCode}</b> để hệ thống đối
                soát chính xác.
              </p>
            </div>
          </div>
        )}

        {!paid && (
          <div className="mt-6 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
            {awaiting ? (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-5 w-5 shrink-0 text-amber-500" />
                <p>
                  Đã ghi nhận. Đang chờ quản trị viên xác nhận khoản chuyển — trang sẽ tự
                  cập nhật khi gói được kích hoạt (giữ trang này mở).
                </p>
                <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Sau khi chuyển khoản xong, bấm nút bên cạnh để báo cho quản trị viên xác
                  nhận.
                </p>
                <Button onClick={markPaid} disabled={marking}>
                  {marking ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Đang gửi...
                    </>
                  ) : (
                    'Tôi đã chuyển khoản'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  highlight,
  onCopy,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-2">
        <span className={highlight ? 'font-bold text-primary' : 'font-medium'}>
          {value}
        </span>
        {onCopy && (
          <button
            onClick={onCopy}
            className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="Sao chép"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </dd>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <CheckoutInner />
    </Suspense>
  );
}
