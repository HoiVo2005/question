/** Định dạng ngày giờ kiểu Việt Nam, an toàn với giá trị rỗng. */
export function formatDateVi(
  value?: string | number | Date | null,
  withTime = true
): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}