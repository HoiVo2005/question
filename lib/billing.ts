import { supabaseAdmin } from '@/lib/supabase/client';
import type { BillingCycle, PlanId } from '@/lib/plans';

// -----------------------------------------------------------------------------
// Helper phía server cho tính năng gói đăng ký & thanh toán VietQR.
// -----------------------------------------------------------------------------

export interface ActiveSubscription {
  plan: PlanId;
  cycle: BillingCycle;
  status: 'active' | 'expired';
  expiresAt: string | null;
}

const FREE_SUB: ActiveSubscription = {
  plan: 'free',
  cycle: 'monthly',
  status: 'active',
  expiresAt: null,
};

/** Email được cấp quyền admin, khai báo qua biến môi trường ADMIN_EMAILS (phân tách bằng dấu phẩy). */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** Người dùng là admin khi có role 'admin' HOẶC email nằm trong ADMIN_EMAILS. */
export function isAdminUser(
  user?: { email?: string | null; role?: string | null } | null
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return isAdminEmail(user.email);
}

/** Sinh nội dung chuyển khoản duy nhất để đối soát, ví dụ "EXG7K2QOP". */
export function generateTransferCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `EXG${code}`;
}

/** Tạo URL ảnh QR VietQR từ thông tin tài khoản trong .env. */
export function buildVietQrUrl(amount: number, addInfo: string): string {
  const bank = process.env.PAYMENT_BANK_ID || '';
  const account = process.env.PAYMENT_ACCOUNT_NO || '';
  const name = process.env.PAYMENT_ACCOUNT_NAME || '';
  const base = `https://img.vietqr.io/image/${bank}-${account}-compact2.png`;
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName: name,
  });
  return `${base}?${params.toString()}`;
}

/** Thông tin tài khoản nhận tiền (hiển thị cho người dùng đối chiếu). */
export function paymentAccountInfo() {
  return {
    bankId: process.env.PAYMENT_BANK_ID || '',
    accountNo: process.env.PAYMENT_ACCOUNT_NO || '',
    accountName: process.env.PAYMENT_ACCOUNT_NAME || '',
    configured: Boolean(process.env.PAYMENT_BANK_ID && process.env.PAYMENT_ACCOUNT_NO),
  };
}

/**
 * Lấy gói đang áp dụng của user. Nếu hết hạn thì tự hạ về 'free'
 * và cập nhật trạng thái trong DB.
 */
export async function getActiveSubscription(userId: string): Promise<ActiveSubscription> {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, cycle, status, expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data || data.plan === 'free') return FREE_SUB;

  const expired =
    data.expires_at != null && new Date(data.expires_at).getTime() < Date.now();

  if (expired) {
    // Hết hạn -> đánh dấu expired (giữ lại plan để biết lịch sử, nhưng coi như free).
    if (data.status !== 'expired') {
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    }
    return { ...FREE_SUB, status: 'expired' };
  }

  return {
    plan: data.plan as PlanId,
    cycle: (data.cycle as BillingCycle) || 'monthly',
    status: 'active',
    expiresAt: data.expires_at,
  };
}

/**
 * Kích hoạt / gia hạn gói cho user. Cộng dồn thời hạn nếu gói còn hiệu lực
 * cùng loại; ngược lại tính từ thời điểm hiện tại.
 */
export async function activateSubscription(
  userId: string,
  plan: Exclude<PlanId, 'free'>,
  cycle: BillingCycle,
  durationDays: number
): Promise<ActiveSubscription> {
  const current = await getActiveSubscription(userId);
  const now = Date.now();

  // Nếu đang dùng đúng gói này và còn hạn -> cộng dồn, ngược lại bắt đầu mới.
  const base =
    current.plan === plan && current.expiresAt
      ? Math.max(now, new Date(current.expiresAt).getTime())
      : now;
  const expiresAt = new Date(base + durationDays * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  await supabaseAdmin.from('subscriptions').upsert(
    {
      user_id: userId,
      plan,
      cycle,
      status: 'active',
      started_at: nowIso,
      expires_at: expiresAt,
      updated_at: nowIso,
    },
    { onConflict: 'user_id' }
  );

  return { plan, cycle, status: 'active', expiresAt };
}
