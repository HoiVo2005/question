// Định nghĩa các gói đăng ký dành cho giáo viên.
// Giá theo USD/tháng (giống mẫu tham khảo); gói năm được giảm ~2 tháng.

export type PlanId = 'free' | 'plus' | 'pro' | 'max';

export interface PlanFeature {
  title: string;
  desc: string;
}

export interface Plan {
  id: PlanId;
  name: string;
  /** Mô tả ngắn hiển thị dưới tên gói trong thẻ chọn gói. */
  tagline: string;
  /** Giá theo tháng (USD). 0 = miễn phí. */
  monthly: number;
  /** Giá mỗi tháng khi trả theo năm (USD) — đã giảm. */
  yearly: number;
  /** Số tiền thực thu khi thanh toán theo tháng (VND). */
  monthlyVnd: number;
  /** Số tiền thực thu khi thanh toán theo năm (VND, tổng cả năm). */
  yearlyVnd: number;
  /** Có hiển thị tiền tố "từ" trước giá không (cho gói doanh nghiệp). */
  pricePrefix?: string;
  /** Màu icon nền (tailwind class). */
  accent: string;
  /** Nhãn nút hành động. */
  cta: string;
  /** Tiêu đề panel quyền lợi bên trái. */
  unlockTitle: string;
  /** Danh sách quyền lợi hiển thị ở panel bên trái. */
  features: PlanFeature[];
}

// Hệ số quy đổi USD -> VND để hiển thị thêm giá tham khảo.
export const USD_TO_VND = 25000;

export const PLANS: Record<Exclude<PlanId, 'free'>, Plan> = {
  plus: {
    id: 'plus',
    name: 'PLUS',
    tagline: 'Tốt nhất cho giáo viên dạy đơn lẻ, người hướng dẫn',
    monthly: 12.49,
    yearly: 9.99,
    monthlyVnd: 299000,
    yearlyVnd: 2990000,
    accent: 'text-amber-500',
    cta: 'Chọn PLUS',
    unlockTitle: 'PLUS',
    features: [
      {
        title: 'Sử dụng Cá nhân hoặc Quy mô nhỏ',
        desc: 'Lý tưởng cho cá nhân hoặc sử dụng hạn chế mà không cần quyền truy cập chung.',
      },
      {
        title: '200 Kết quả hàng tháng',
        desc: 'Theo dõi lên đến 200 kết quả bài kiểm tra trực tuyến hoặc trên giấy mỗi tháng.',
      },
      {
        title: '20 Lượt tạo bài kiểm tra bằng AI',
        desc: 'Tạo tối đa 20 bài kiểm tra độc bản hỗ trợ bởi AI mỗi tháng để thử thách học sinh với những câu hỏi mới mẻ.',
      },
      {
        title: 'Không giới hạn Câu hỏi & Bài kiểm tra',
        desc: 'Tạo và tiến hành không giới hạn số lượng bài kiểm tra và câu hỏi.',
      },
      {
        title: 'Hệ thống Anti-Cheat không giới hạn',
        desc: 'Hệ thống Anti-Cheat đáng tin cậy để ngăn chặn gian lận trong các bài kiểm tra trực tuyến.',
      },
    ],
  },
  pro: {
    id: 'pro',
    name: 'PRO',
    tagline: 'Tốt nhất cho các trường học nhỏ, doanh nghiệp nhỏ',
    monthly: 32.99,
    yearly: 26.99,
    monthlyVnd: 799000,
    yearlyVnd: 7990000,
    accent: 'text-sky-500',
    cta: 'Chọn PRO',
    unlockTitle: 'PRO',
    features: [
      {
        title: 'Cộng tác theo Nhóm',
        desc: 'Mời tối đa 10 giáo viên cùng quản lý ngân hàng đề và lớp học chung.',
      },
      {
        title: '1.000 Kết quả hàng tháng',
        desc: 'Theo dõi lên đến 1.000 kết quả bài kiểm tra trực tuyến hoặc trên giấy mỗi tháng.',
      },
      {
        title: '100 Lượt tạo bài kiểm tra bằng AI',
        desc: 'Tạo tối đa 100 bài kiểm tra độc bản hỗ trợ bởi AI mỗi tháng cho cả nhóm.',
      },
      {
        title: 'Thư viện đề dùng chung',
        desc: 'Lưu trữ và chia sẻ ngân hàng đề trong nội bộ trường, doanh nghiệp.',
      },
      {
        title: 'Báo cáo & Thống kê nâng cao',
        desc: 'Phân tích kết quả chi tiết theo lớp, theo môn và xuất báo cáo.',
      },
    ],
  },
  max: {
    id: 'max',
    name: 'MAX',
    tagline: 'Tốt nhất cho các trường học lớn hơn, đại học, công ty',
    monthly: 64.99,
    yearly: 54.99,
    monthlyVnd: 1590000,
    yearlyVnd: 15900000,
    pricePrefix: 'từ',
    accent: 'text-violet-500',
    cta: 'Liên hệ với chúng tôi',
    unlockTitle: 'MAX',
    features: [
      {
        title: 'Cộng tác cấp Doanh nghiệp',
        desc: 'Quyền truy cập nhóm chuyên dụng, tùy chỉnh. Bắt đầu từ hơn 10 tài khoản.',
      },
      {
        title: 'Giới hạn Kết quả chuyên dụng',
        desc: 'Giới hạn kết quả chuyên dụng, tùy chỉnh. Bắt đầu từ hơn 3000 kết quả hàng tháng.',
      },
      {
        title: 'Tạo bài kiểm tra bằng AI không giới hạn',
        desc: 'Không giới hạn việc tạo bài kiểm tra hỗ trợ bởi AI. Tạo bao nhiêu tùy nhu cầu của bạn.',
      },
      {
        title: 'Thương hiệu tùy chỉnh',
        desc: 'Gắn thương hiệu vào tất cả tài liệu của bạn với logo tùy chỉnh để có trải nghiệm nhất quán.',
      },
      {
        title: 'Hỗ trợ Ưu tiên (Premium)',
        desc: 'Truy cập hỗ trợ ưu tiên với cam kết mức độ dịch vụ (SLA) tùy chọn theo yêu cầu.',
      },
    ],
  },
};

/** Thứ tự hiển thị các gói trả phí. */
export const PAID_PLAN_ORDER: Exclude<PlanId, 'free'>[] = ['plus', 'pro', 'max'];

export const PLAN_LABELS: Record<PlanId, string> = {
  free: 'Miễn phí',
  plus: 'PLUS',
  pro: 'PRO',
  max: 'MAX',
};

/** Định dạng giá USD gọn gàng (giữ 2 chữ số nếu có phần lẻ). */
export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export type BillingCycle = 'monthly' | 'yearly';

/** Số tiền VND cần thanh toán cho 1 gói theo chu kỳ. */
export function vndPrice(plan: Exclude<PlanId, 'free'>, cycle: BillingCycle): number {
  const p = PLANS[plan];
  return cycle === 'yearly' ? p.yearlyVnd : p.monthlyVnd;
}

/** Số ngày được cộng thêm khi kích hoạt/gia hạn theo chu kỳ. */
export function planDurationDays(cycle: BillingCycle): number {
  return cycle === 'yearly' ? 365 : 30;
}

/** Định dạng tiền VND, ví dụ 299000 -> "299.000₫". */
export function formatVnd(value: number): string {
  return value.toLocaleString('vi-VN') + '₫';
}
