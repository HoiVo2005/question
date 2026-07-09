// =============================================================================
// Ma trận phân bổ mức độ tư duy theo lớp (chuẩn Bộ GD&ĐT)
// =============================================================================
// - Lớp 1–5 (Tiểu học, Thông tư 27): 3 mức độ.
// - Lớp 6–12 (THCS/THPT, Thông tư 22 + CT GDPT 2018): 4 mức độ.
//
// Tỉ lệ mặc định là tỉ lệ phổ biến theo ma trận đề của Bộ; có thể chỉnh ở
// hằng số bên dưới nếu trường bạn dùng tỉ lệ khác.
// =============================================================================

export interface CognitiveLevel {
  /** Mã ngắn dùng trong dữ liệu (NB, TH, VD, VDC, M1, M2, M3). */
  key: string;
  /** Nhãn hiển thị tiếng Việt. */
  label: string;
  /** Mô tả ngắn (dùng cho prompt AI). */
  description: string;
  /** Trọng số phân bổ (tổng = 1). */
  weight: number;
}

// Lớp 6–12: Nhận biết 40% – Thông hiểu 30% – Vận dụng 20% – Vận dụng cao 10%
const SECONDARY_LEVELS: CognitiveLevel[] = [
  {
    key: 'NB',
    label: 'Nhận biết',
    description: 'Nhớ, nhận ra, nhắc lại kiến thức đã học.',
    weight: 0.4,
  },
  {
    key: 'TH',
    label: 'Thông hiểu',
    description: 'Hiểu, giải thích, so sánh, trình bày lại theo cách hiểu.',
    weight: 0.3,
  },
  {
    key: 'VD',
    label: 'Vận dụng',
    description: 'Áp dụng kiến thức để giải quyết tình huống quen thuộc.',
    weight: 0.2,
  },
  {
    key: 'VDC',
    label: 'Vận dụng cao',
    description:
      'Phân tích, tổng hợp, sáng tạo, giải quyết tình huống mới, phức tạp.',
    weight: 0.1,
  },
];

// Lớp 1–5: Mức độ 1 40% – Mức độ 2 40% – Mức độ 3 20%
const PRIMARY_LEVELS: CognitiveLevel[] = [
  {
    key: 'M1',
    label: 'Mức độ 1 (Nhận biết, nhắc lại)',
    description: 'Nhận biết, nhắc lại được kiến thức, kĩ năng đã học.',
    weight: 0.4,
  },
  {
    key: 'M2',
    label: 'Mức độ 2 (Thông hiểu, giải thích)',
    description: 'Hiểu, kết nối, giải thích được kiến thức, kĩ năng đã học.',
    weight: 0.4,
  },
  {
    key: 'M3',
    label: 'Mức độ 3 (Vận dụng, sáng tạo)',
    description:
      'Vận dụng kiến thức, kĩ năng vào tình huống mới; giải quyết vấn đề sáng tạo.',
    weight: 0.2,
  },
];

export type GradeBand = 'primary' | 'secondary';

export function getGradeBand(grade: number): GradeBand {
  return grade <= 5 ? 'primary' : 'secondary';
}

export function getLevels(grade: number): CognitiveLevel[] {
  return getGradeBand(grade) === 'primary' ? PRIMARY_LEVELS : SECONDARY_LEVELS;
}

/**
 * Chia `total` theo `weights` sao cho tổng các phần đúng bằng `total`
 * (phương pháp số dư lớn nhất – largest remainder).
 */
export function distributeByWeights(total: number, weights: number[]): number[] {
  if (total <= 0) return weights.map(() => 0);
  const sumW = weights.reduce((a, b) => a + b, 0) || 1;
  const ideal = weights.map((w) => (total * w) / sumW);
  const floors = ideal.map((x) => Math.floor(x));
  let remaining = total - floors.reduce((a, b) => a + b, 0);

  // Phân phần dư cho các mục có phần thập phân lớn nhất.
  const order = ideal
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  let k = 0;
  while (remaining > 0 && order.length > 0) {
    result[order[k % order.length].i] += 1;
    remaining -= 1;
    k += 1;
  }
  return result;
}

export interface BlueprintRow {
  level: CognitiveLevel;
  mcq: number;
  essay: number;
  total: number;
}

export interface ExamBlueprint {
  grade: number;
  band: GradeBand;
  levels: CognitiveLevel[];
  rows: BlueprintRow[];
  totalMcq: number;
  totalEssay: number;
  total: number;
}

/**
 * Xây ma trận đề: phân bổ số câu trắc nghiệm và tự luận theo từng mức độ.
 * Trắc nghiệm và tự luận được phân bổ độc lập theo cùng tỉ lệ chuẩn.
 */
export function buildBlueprint(
  grade: number,
  mcqCount: number,
  essayCount: number
): ExamBlueprint {
  const levels = getLevels(grade);
  const weights = levels.map((l) => l.weight);

  // Trắc nghiệm: phân bổ theo tỉ lệ chuẩn (nặng ở mức thấp).
  const mcqDist = distributeByWeights(mcqCount, weights);
  // Tự luận: nghiêng về MỨC ĐỘ CAO (vận dụng / vận dụng cao) — đảo trọng số,
  // để câu tự luận khó hơn thay vì hỏi khái niệm dễ.
  const essayWeights = [...weights].reverse();
  const essayDist = distributeByWeights(essayCount, essayWeights);

  const rows: BlueprintRow[] = levels.map((level, i) => ({
    level,
    mcq: mcqDist[i],
    essay: essayDist[i],
    total: mcqDist[i] + essayDist[i],
  }));

  return {
    grade,
    band: getGradeBand(grade),
    levels,
    rows,
    totalMcq: mcqCount,
    totalEssay: essayCount,
    total: mcqCount + essayCount,
  };
}

/** Dòng tóm tắt ma trận để đưa vào prompt AI, ví dụ: "Nhận biết: 4 TN, 1 TL". */
export function blueprintToText(bp: ExamBlueprint): string {
  return bp.rows
    .filter((r) => r.total > 0)
    .map(
      (r) =>
        `- ${r.level.label} (${r.level.description}): ${r.mcq} câu trắc nghiệm, ${r.essay} câu tự luận`
    )
    .join('\n');
}