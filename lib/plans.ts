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
    tagline: 'Tốt nhất cho giáo viên cá nhân và lớp nhỏ',
    monthly: 12.49,
    yearly: 9.99,
    monthlyVnd: 299000,
    yearlyVnd: 2990000,
    accent: 'text-amber-500',
    cta: 'Chọn PLUS',
    unlockTitle: 'PLUS',
    features: [
      {
        title: 'Dành cho giáo viên cá nhân',
        desc: 'Phù hợp với giáo viên riêng lẻ hoặc nhóm nhỏ muốn quản lý đề thi đơn giản.',
      },
      {
        title: '200 kết quả hàng tháng',
        desc: 'Theo dõi lên đến 200 kết quả bài kiểm tra trực tuyến hoặc in ấn mỗi tháng.',
      },
      {
        title: '20 lượt tạo đề AI/tháng',
        desc: 'Tạo tối đa 20 bài kiểm tra độc bản bằng AI mỗi tháng.',
      },
      {
        title: 'Không giới hạn đề & câu hỏi',
        desc: 'Tạo và lưu trữ không giới hạn câu hỏi, mã đề và đề thi.',
      },
      {
        title: 'Chống gian lận cơ bản',
        desc: 'Bao gồm tính năng ngăn đánh dấu/cheat để bảo vệ bài kiểm tra trực tuyến.',
      },
    ],
  },
  pro: {
    id: 'pro',
    name: 'PRO',
    tagline: 'Tốt nhất cho trường học nhỏ và tổ chức đào tạo',
    monthly: 32.99,
    yearly: 26.99,
    monthlyVnd: 799000,
    yearlyVnd: 7990000,
    accent: 'text-sky-500',
    cta: 'Chọn PRO',
    unlockTitle: 'PRO',
    features: [
      {
        title: 'Cộng tác nhóm đến 10 giáo viên',
        desc: 'Chia sẻ ngân hàng đề và lớp học trong tổ chức với quyền truy cập nhóm.',
      },
      {
        title: '1.000 kết quả hàng tháng',
        desc: 'Theo dõi lên đến 1.000 kết quả bài kiểm tra trực tuyến hoặc in ấn mỗi tháng.',
      },
      {
        title: '100 lượt tạo đề AI/tháng',
        desc: 'Tạo tối đa 100 bài kiểm tra AI mỗi tháng cho cả nhóm sử dụng.',
      },
      {
        title: 'Thư viện đề dùng chung',
        desc: 'Lưu trữ và chia sẻ ngân hàng đề giữa các giáo viên trong tổ chức.',
      },
      {
        title: 'Báo cáo & thống kê nâng cao',
        desc: 'Phân tích kết quả theo lớp, môn học và xuất báo cáo chi tiết.',
      },
    ],
  },
  max: {
    id: 'max',
    name: 'MAX',
    tagline: 'Tốt nhất cho tổ chức lớn, trường học và doanh nghiệp',
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
        title: 'Giải pháp doanh nghiệp',
        desc: 'Hỗ trợ cấu hình theo quy mô lớn, nhiều tài khoản và quản lý tập trung.',
      },
      {
        title: 'Kết quả hàng tháng tùy chỉnh',
        desc: 'Hạn mức kết quả linh hoạt với cấu hình dành cho hơn 3.000 kết quả mỗi tháng.',
      },
      {
        title: 'Tạo đề AI không giới hạn',
        desc: 'Không giới hạn số bài kiểm tra được tạo bằng trợ lý AI.',
      },
      {
        title: 'Thương hiệu tùy chỉnh',
        desc: 'Tùy chỉnh logo và giao diện tài liệu để phù hợp thương hiệu tổ chức.',
      },
      {
        title: 'Hỗ trợ ưu tiên',
        desc: 'Được hỗ trợ nhanh với dịch vụ cao cấp và SLA theo yêu cầu.',
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
