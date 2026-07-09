'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Check, X, Star, Gem, Crown, BadgeCheck } from 'lucide-react';
import { usePlan } from '@/lib/hooks/use-plan';
import {
  PLANS,
  PAID_PLAN_ORDER,
  formatUsd,
  formatVnd,
  vndPrice,
  type Plan,
  type PlanId,
} from '@/lib/plans';
import { notify } from '@/lib/swal';

const PLAN_ICON: Record<Exclude<PlanId, 'free'>, typeof Star> = {
  plus: Star,
  pro: Gem,
  max: Crown,
};

export function UpgradeModal({
  open,
  onClose,
  initialPlan = 'plus',
}: {
  open: boolean;
  onClose: () => void;
  initialPlan?: Exclude<PlanId, 'free'>;
}) {
  const router = useRouter();
  const { plan: currentPlan } = usePlan();
  const [yearly, setYearly] = useState(false);
  const [selected, setSelected] = useState<Exclude<PlanId, 'free'>>(initialPlan);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) setSelected(initialPlan);
  }, [open, initialPlan]);

  // Khoá cuộn nền khi mở modal.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onEsc);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const active: Plan = PLANS[selected];
  const price = (p: Plan) => (yearly ? p.yearly : p.monthly);

  const handleConfirm = async () => {
    if (selected === 'max') {
      await notify(
        'Gói MAX dành cho trường/doanh nghiệp với cấu hình riêng. Vui lòng liên hệ sales@examgen.vn — chúng tôi sẽ thiết lập và kích hoạt gói cho bạn.',
        'info'
      );
      return;
    }
    // Chuyển sang trang thanh toán VietQR cho gói đã chọn.
    onClose();
    router.push(
      `/teacher/billing/checkout?plan=${selected}&cycle=${yearly ? 'yearly' : 'monthly'}`
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel quyền lợi (bên trái) */}
        <aside className="hidden w-full shrink-0 overflow-y-auto bg-gradient-to-b from-blue-600 to-indigo-700 p-7 text-white md:block md:w-[42%]">
          <h3 className="text-2xl font-extrabold leading-snug">
            Mở khóa quyền truy cập tới các tính năng của{' '}
            <span className="text-amber-300">{active.unlockTitle}</span>
          </h3>
          <ul className="mt-6 space-y-4">
            {active.features.map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <div>
                  <p className="font-semibold leading-tight">{f.title}</p>
                  <p className="mt-0.5 text-sm text-blue-100/90">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Bảng chọn gói (bên phải) */}
        <section className="flex min-w-0 flex-1 flex-col overflow-y-auto p-6 sm:p-7">
          <div className="flex items-start justify-between">
            <h2 className="text-2xl font-bold">Nâng cấp gói của bạn</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Toggle Tháng / Năm */}
          <div className="mt-5 flex items-center justify-center gap-3 text-sm">
            <span className={!yearly ? 'font-semibold' : 'text-muted-foreground'}>
              Hàng tháng
            </span>
            <button
              role="switch"
              aria-checked={yearly}
              onClick={() => setYearly((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                yearly ? 'bg-blue-600' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  yearly ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
            <span className={yearly ? 'font-semibold' : 'text-muted-foreground'}>
              Hàng năm
            </span>
            {yearly && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                Tiết kiệm ~20%
              </span>
            )}
          </div>

          {/* Các thẻ gói */}
          <div className="mt-5 space-y-3">
            {PAID_PLAN_ORDER.map((id) => {
              const p = PLANS[id];
              const Icon = PLAN_ICON[id];
              const isSelected = selected === id;
              const isCurrent = currentPlan === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelected(id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                      : 'border-border bg-card hover:border-blue-300 hover:bg-muted/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{p.name}</span>
                      {isCurrent && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <BadgeCheck className="h-3 w-3" /> Đang dùng
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-0.5 text-sm ${
                        isSelected ? 'text-blue-50/90' : 'text-muted-foreground'
                      }`}
                    >
                      {p.tagline}
                    </p>
                    <p className="mt-1.5">
                      {p.pricePrefix && (
                        <span className="text-sm font-medium">{p.pricePrefix} </span>
                      )}
                      <span className="text-xl font-extrabold">{formatUsd(price(p))}</span>
                      <span
                        className={`text-sm ${
                          isSelected ? 'text-blue-50/90' : 'text-muted-foreground'
                        }`}
                      >
                        {' '}
                        / tháng
                      </span>
                    </p>
                    <p
                      className={`text-xs ${
                        isSelected ? 'text-blue-50/90' : 'text-muted-foreground'
                      }`}
                    >
                      Thanh toán{' '}
                      {formatVnd(vndPrice(id, yearly ? 'yearly' : 'monthly'))}
                      {yearly ? ' / năm' : ' / tháng'}
                    </p>
                  </div>
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                      isSelected ? 'bg-white/20' : 'bg-amber-50'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${isSelected ? 'text-white' : p.accent}`}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Nút hành động */}
          <button
            onClick={handleConfirm}
            disabled={currentPlan === selected && selected !== 'max'}
            className="mt-5 w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {currentPlan === selected && selected !== 'max'
              ? `Bạn đang dùng gói ${active.name}`
              : active.cta}
          </button>
          {yearly && selected !== 'max' && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Thanh toán {formatVnd(vndPrice(selected, 'yearly'))} mỗi năm
            </p>
          )}
        </section>
      </div>
    </div>,
    document.body
  );
}
