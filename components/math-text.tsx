'use client';

import katex from 'katex';
import 'katex/dist/katex.min.css';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Chuyển ký hiệu thường thành đẹp mắt (số mũ, chỉ số, căn) cho phần văn bản thường.
function prettyPlainMath(s: string): string {
  return s
    // luỹ thừa: x^{n+1}, x^2, x^n
    .replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>')
    .replace(/\^([A-Za-zÀ-ỹ0-9+\-]+)/g, '<sup>$1</sup>')
    // chỉ số dưới: a_{ij}, a_1
    .replace(/_\{([^}]*)\}/g, '<sub>$1</sub>')
    .replace(/_([A-Za-z0-9]+)/g, '<sub>$1</sub>')
    // căn bậc hai: sqrt(...) -> √(...)
    .replace(/\bsqrt\s*\(/gi, '√(')
    .replace(/\n/g, '<br/>');
}

/**
 * Hiển thị văn bản có lẫn công thức LaTeX:
 *  - $...$   : công thức trong dòng
 *  - $$...$$ : công thức tách dòng
 * Phần còn lại hiển thị như văn bản thường (giữ xuống dòng).
 */
export function MathText({
  text,
  className,
}: {
  text?: string | null;
  className?: string;
}) {
  if (!text) return null;

  const parts = String(text).split(/(\$\$[^$]*\$\$|\$[^$]+\$)/g);

  const html = parts
    .map((p) => {
      try {
        if (p.startsWith('$$') && p.endsWith('$$') && p.length > 4) {
          return katex.renderToString(p.slice(2, -2), {
            throwOnError: false,
            displayMode: true,
          });
        }
        if (p.startsWith('$') && p.endsWith('$') && p.length > 2) {
          return katex.renderToString(p.slice(1, -1), {
            throwOnError: false,
            displayMode: false,
          });
        }
      } catch {
        // rơi xuống hiển thị thường
      }
      return prettyPlainMath(escapeHtml(p));
    })
    .join('');

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
