'use client';

// Bọc SweetAlert2 với giao diện đồng bộ theo theme (indigo).
// Dùng dynamic import để an toàn khi SSR.

type Icon = 'success' | 'error' | 'warning' | 'info' | 'question';

const PRIMARY = '#4f46e5'; // indigo-600
const DANGER = '#dc2626'; // red-600
const NEUTRAL = '#6b7280'; // gray-500

async function swal() {
  const mod = await import('sweetalert2');
  return mod.default;
}

/** Hộp thoại xác nhận xoá (nguy hiểm). Trả về true nếu người dùng đồng ý. */
export async function confirmDelete(opts: {
  title?: string;
  text?: string;
  confirmText?: string;
}): Promise<boolean> {
  const Swal = await swal();
  const res = await Swal.fire({
    title: opts.title ?? 'Xác nhận xoá',
    text: opts.text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: opts.confirmText ?? 'Xoá',
    cancelButtonText: 'Huỷ',
    confirmButtonColor: DANGER,
    cancelButtonColor: NEUTRAL,
    reverseButtons: true,
  });
  return res.isConfirmed;
}

/** Hộp thoại xác nhận hành động (trung tính), ví dụ nộp bài. */
export async function confirmAction(opts: {
  title?: string;
  text?: string;
  confirmText?: string;
  icon?: Icon;
}): Promise<boolean> {
  const Swal = await swal();
  const res = await Swal.fire({
    title: opts.title ?? 'Xác nhận',
    text: opts.text,
    icon: opts.icon ?? 'question',
    showCancelButton: true,
    confirmButtonText: opts.confirmText ?? 'Đồng ý',
    cancelButtonText: 'Huỷ',
    confirmButtonColor: PRIMARY,
    cancelButtonColor: NEUTRAL,
    reverseButtons: true,
  });
  return res.isConfirmed;
}

/** Hộp thoại thông báo (OK). */
export async function notify(
  text: string,
  icon: Icon = 'info',
  title?: string
): Promise<void> {
  const Swal = await swal();
  await Swal.fire({
    title: title ?? defaultTitle(icon),
    text,
    icon,
    confirmButtonText: 'Đã hiểu',
    confirmButtonColor: PRIMARY,
  });
}

/** Thông báo nhỏ góc màn hình (toast). */
export async function toast(text: string, icon: Icon = 'success'): Promise<void> {
  const Swal = await swal();
  await Swal.fire({
    toast: true,
    position: 'top-end',
    timer: 2600,
    timerProgressBar: true,
    showConfirmButton: false,
    icon,
    title: text,
  });
}

function defaultTitle(icon: Icon): string {
  switch (icon) {
    case 'success':
      return 'Thành công';
    case 'error':
      return 'Có lỗi';
    case 'warning':
      return 'Lưu ý';
    case 'question':
      return 'Xác nhận';
    default:
      return 'Thông báo';
  }
}