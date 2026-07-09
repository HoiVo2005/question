import Groq from 'groq-sdk';
import { supabaseAdmin } from './supabase/client';
import {
  buildBlueprint,
  blueprintToText,
  getLevels,
  type ExamBlueprint,
} from './exam-blueprint';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Model Groq chất lượng cao, hỗ trợ JSON mode và tiếng Việt tốt.
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface ExamHeader {
  department?: string; // Sở GD&ĐT
  school?: string; // Trường
  title?: string; // Tiêu đề đề thi
  schoolYear?: string; // Năm học
}

export interface ExamGenConfig {
  grade: number; // 1..12
  subject: string; // Môn học
  chapter: string; // Bài học/Chương
  mcqCount: number; // Số câu trắc nghiệm
  essayCount: number; // Số câu tự luận
  durationMinutes: number; // Thời gian làm bài
  setCount: number; // Số mã đề
  mcqPoints: number; // Tổng điểm phần trắc nghiệm
  essayPoints: number; // Tổng điểm phần tự luận
  header: ExamHeader;
}

export interface GeneratedQuestion {
  questionNumber: number;
  type: 'mcq' | 'essay';
  cognitiveLevel: string; // NB/TH/VD/VDC hoặc M1/M2/M3
  content: string;
  options?: { A: string; B: string; C: string; D: string };
  correctAnswer?: string; // 'A'|'B'|'C'|'D' cho trắc nghiệm
  explanation?: string; // Lời giải chi tiết
  modelAnswer?: string; // Đáp án mẫu cho tự luận
  points?: number;
  figure?: any; // Dữ liệu hình học (toạ độ) để vẽ SVG
  chart?: any; // Dữ liệu biểu đồ (Địa lí...) để vẽ bằng recharts
}

export interface GeneratedExamSet {
  setCode: string;
  questions: GeneratedQuestion[];
  answerKey: Record<number, string>;
  blueprint: ExamBlueprint;
}

export async function generateExamSets(
  config: ExamGenConfig
): Promise<GeneratedExamSet[]> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      'GROQ_API_KEY chưa được cấu hình. Vui lòng thêm vào .env.local (lấy tại https://console.groq.com).'
    );
  }

  const blueprint = buildBlueprint(
    config.grade,
    config.mcqCount,
    config.essayCount
  );

  const examSets: GeneratedExamSet[] = [];

  for (let setNum = 0; setNum < config.setCount; setNum++) {
    const setCode = generateSetCode(setNum);
    const prompt = buildGenerationPrompt(config, blueprint, setNum);

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.8,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Bạn là chuyên gia ra đề thi của Bộ Giáo dục và Đào tạo Việt Nam. ' +
            'Bạn ra đề bám sát chương trình GDPT hiện hành, đúng trình độ từng lớp, ' +
            'đáp án chính xác tuyệt đối. Chỉ trả về JSON hợp lệ, không thêm chữ nào khác.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const text = completion.choices[0]?.message?.content || '';
    const questions = parseQuestions(text, config);

    const answerKey: Record<number, string> = {};
    for (const q of questions) {
      if (q.type === 'mcq' && q.correctAnswer) {
        answerKey[q.questionNumber] = q.correctAnswer;
      }
    }

    examSets.push({ setCode, questions, answerKey, blueprint });
  }

  return examSets;
}

function generateSetCode(index: number): string {
  // 0101, 0102, ... giống mã đề thi thật.
  return String(101 + index).padStart(4, '0');
}

/** Bỏ dấu tiếng Việt + viết thường để so khớp tên môn/chương. */
function normalizeVi(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
}

type SubjectKind =
  | 'english'
  | 'math-geometry'
  | 'math'
  | 'geography'
  | 'literature'
  | 'generic';

function detectSubjectKind(config: ExamGenConfig): SubjectKind {
  const subj = normalizeVi(config.subject);
  const chap = normalizeVi(config.chapter);

  if (subj.includes('anh') || subj.includes('english')) return 'english';

  // "Địa lí" và "Lịch sử và Địa lí" → có yếu tố Atlat/biểu đồ đặc trưng.
  if (subj.includes('dia li') || subj.includes('dia ly') || subj.includes('geography'))
    return 'geography';

  if (subj.includes('toan') || subj.includes('math')) {
    const geoHints = [
      'hinh hoc',
      'hinh',
      'tam giac',
      'duong tron',
      'vecto',
      'vec to',
      'toa do',
      'oxy',
      'oxyz',
      'goc',
      'tu giac',
      'da giac',
      'hinh chop',
      'hinh lang tru',
      'duong thang',
      'mat phang',
      'doi xung',
      'dinh ly',
    ];
    if (geoHints.some((h) => chap.includes(h))) return 'math-geometry';
    return 'math';
  }

  if (subj.includes('van') || subj.includes('literature')) return 'literature';

  return 'generic';
}

/**
 * Hướng dẫn ĐẶC THÙ THEO MÔN để đề bám sát cấu trúc đề của Bộ GD&ĐT.
 * Trả về { language, block } — language quyết định ngôn ngữ NỘI DUNG câu hỏi.
 */
function getSubjectGuidance(
  config: ExamGenConfig,
  blueprint: ExamBlueprint
): { language: string; block: string } {
  const kind = detectSubjectKind(config);

  if (kind === 'english') {
    return {
      language:
        '- NGÔN NGỮ: Toàn bộ phần "content" (đề bài, ngữ liệu, đoạn văn) và 4 phương án ' +
        'A/B/C/D PHẢI viết HOÀN TOÀN BẰNG TIẾNG ANH (vì đây là đề thi môn Tiếng Anh). ' +
        'CHỈ phần "explanation" và "modelAnswer" (lời giải/hướng dẫn) viết bằng tiếng Việt để ' +
        'giáo viên dễ chấm.',
      block: `CẤU TRÚC ĐỀ TIẾNG ANH (bám sát đề Bộ GD&ĐT) — PHÂN BỔ ${blueprint.totalMcq} câu trắc nghiệm vào CÁC DẠNG SAU theo thứ tự, mỗi câu MỞ ĐẦU "content" bằng đúng câu lệnh (rubric) tiếng Anh in hoa của dạng đó:
  1) PRONUNCIATION — "Mark the letter A, B, C, or D to indicate the word whose underlined part differs from the other three in pronunciation." (gạch chân âm cần so sánh bằng dấu _giữa hai gạch dưới_, ví dụ: "w_a_nted").
  2) STRESS — "Mark the letter A, B, C, or D to indicate the word that differs from the other three in the position of primary stress." (đánh dấu trọng âm bằng dấu ' trước âm tiết nhấn, ví dụ: "de'velop").
  3) GRAMMAR & VOCABULARY — "Mark the letter A, B, C, or D to indicate the correct answer to each of the following questions." (câu có chỗ trống ___ về thì, mạo từ, giới từ, liên từ, cụm động từ, collocation...).
  4) SYNONYM/ANTONYM — "... indicate the word(s) CLOSEST in meaning to the underlined word(s)" và "... indicate the word(s) OPPOSITE in meaning to the underlined word(s)" (gạch chân cụm cần xét).
  5) ERROR IDENTIFICATION — "Mark the letter A, B, C, or D to indicate the underlined part that needs correction." (4 phương án là 4 phần gạch chân TRONG CÙNG MỘT CÂU; đáp án là phần SAI).
  6) COMMUNICATION — "Mark the letter A, B, C, or D to indicate the most suitable response to complete each exchange." (đoạn hội thoại A–B, chọn lời đáp phù hợp).
  7) CLOZE TEST — một đoạn văn ngắn 80–120 từ có các chỗ trống đánh số (1)__ (2)__ ...; MỖI chỗ trống là MỘT câu hỏi, "content" lặp lại nguyên đoạn (chỉ ở câu đầu của cụm) rồi nêu rõ blank đang hỏi.
  8) READING COMPREHENSION — một đoạn văn 150–250 từ; các câu hỏi về main idea, detail, reference (từ "it/they" chỉ gì), inference, vocabulary in context. "content" câu đầu chứa toàn bộ đoạn đọc.
- Phân bổ hợp lý: nếu ít câu thì ưu tiên 1,2,3,4,5,6; nếu ≥20 câu thì có thêm cloze test và reading.
- ĐỘ KHÓ vẫn theo ma trận mức độ tư duy ở trên (Nhận biết→Vận dụng cao).
- CÂU TỰ LUẬN tiếng Anh (nếu có) là: SENTENCE TRANSFORMATION (rewrite/combine, giữ nguyên nghĩa) hoặc WRITING (viết đoạn 60–100 từ). "content" tiếng Anh, "modelAnswer" cho câu/đoạn mẫu.
- KHÔNG dùng trường "figure" cho môn Tiếng Anh.`,
    };
  }

  if (kind === 'math-geometry') {
    return {
      language: '- Dùng tiếng Việt chuẩn, có dấu.',
      block: `YÊU CẦU RIÊNG CHO HÌNH HỌC (bám sát đề Bộ GD&ĐT):
- ĐÂY LÀ ĐỀ HÌNH HỌC: phần lớn câu hỏi PHẢI gắn với HÌNH VẼ. Với MỌI câu cần hình, BẮT BUỘC
  thêm trường "figure" với toạ độ CHÍNH XÁC, nhất quán với đề bài (đừng để thiếu hình).
- Cấu trúc figure (toạ độ x,y trong khoảng 0..10, gốc dưới-trái, y hướng lên):
  {
    "points": [{"name":"A","x":1,"y":2}],
    "segments": [["A","B"], {"from":"B","to":"C","dashed":true,"label":"a","ticks":2,"arrow":true}],
    "polygons": [["A","B","C"]],
    "circles": [{"x":5,"y":5,"r":3}],
    "rightAngles": [{"at":"A","from":"B","to":"C"}],
    "angles": [{"at":"B","from":"A","to":"C","label":"60°"}],
    "axes": true
  }
- DÙNG ĐÚNG KÝ HIỆU QUY ƯỚC SGK/Bộ GD&ĐT:
  • "rightAngles": thêm dấu GÓC VUÔNG ở MỌI đỉnh vuông (tam giác vuông, đường cao, tiếp tuyến⊥bán kính, ...).
  • "ticks" trong segment: số gạch đánh dấu các cạnh BẰNG NHAU (cạnh bằng nhau dùng CÙNG số gạch, vd 1, 2, 3).
  • "dashed": true cho ĐƯỜNG PHỤ / đường kẻ thêm / đường khuất (đường cao, trung tuyến kẻ thêm...).
  • "angles" + "label": ký hiệu và ghi SỐ ĐO GÓC khi đề cho/hỏi góc.
  • "arrow": true cho VECTƠ; "label" để ghi độ dài cạnh hoặc tên đoạn.
  • "axes": true CHỈ với bài hình học toạ độ Oxy (đặt các điểm theo đúng toạ độ đề cho).
- TOẠ ĐỘ PHẢI ĐÚNG TÍNH CHẤT HÌNH: tam giác vuông tại A thì AB ⊥ AC; tam giác cân/đều thì các
  cạnh bằng nhau; trung điểm nằm chính giữa; hình vuông/chữ nhật/hình thang đúng dạng; tiếp tuyến
  thì vuông góc bán kính tại tiếp điểm. Đặt tên đỉnh theo chuẩn (A, B, C, ...), điểm phụ (M, N, H, O, I).
- Nội dung câu nêu rõ giả thiết hình học; nếu là toạ độ Oxy thì cho toạ độ điểm/đường cụ thể.
- CÂU TỰ LUẬN hình học = bài CHỨNG MINH hoặc TÍNH TOÁN nhiều ý (a, b, c) theo kiểu đề Bộ:
  vẽ hình, chứng minh quan hệ (song song/vuông góc/bằng nhau, tứ giác nội tiếp...), tính độ dài/diện
  tích/góc. "modelAnswer" trình bày lời giải theo BƯỚC, có lập luận và căn cứ định lí. BẮT BUỘC kèm "figure"
  có đầy đủ ký hiệu (góc vuông, gạch cạnh bằng, đường phụ nét đứt).`,
    };
  }

  if (kind === 'math') {
    return {
      language: '- Dùng tiếng Việt chuẩn, có dấu.',
      block: `YÊU CẦU RIÊNG CHO MÔN TOÁN (đại số/giải tích, bám sát đề Bộ GD&ĐT):
- Câu trắc nghiệm là BÀI TẬP TÍNH TOÁN có lời giải ra một đáp số rõ ràng, 4 phương án là các kết quả
  gần nhau (gồm cả "bẫy" do sai lầm thường gặp), KHÔNG hỏi lý thuyết suông.
- Câu tự luận nhiều ý (a, b, c) tăng dần độ khó; "modelAnswer" giải chi tiết theo bước, có đáp số.
- Nếu một số câu cần đồ thị/hình minh hoạ có thể dùng "figure"; phần lớn câu đại số thì KHÔNG cần.`,
    };
  }

  if (kind === 'geography') {
    return {
      language: '- Dùng tiếng Việt chuẩn, có dấu.',
      block: `YÊU CẦU RIÊNG CHO MÔN ĐỊA LÍ (bám sát đề Bộ GD&ĐT) — cần có đủ 4 NHÓM kĩ năng đặc trưng:
- NHÓM ATLAT: một số câu bắt đầu bằng "Căn cứ vào Atlat Địa lí Việt Nam trang ... , cho biết..." (ghi RÕ
  số trang Atlat phù hợp nội dung, vd trang 4-5 hành chính, trang 9 khí hậu, trang 17 kinh tế chung,
  trang 21 công nghiệp, trang 25 du lịch...). Câu hỏi đúng kiểu khai thác Atlat (kể tên, xác định, nhận xét).
- NHÓM BẢNG SỐ LIỆU: ÍT NHẤT vài câu cho một BẢNG SỐ LIỆU ngắn (ghi rõ tên bảng, đơn vị, có nguồn
  "Nguồn: Tổng cục Thống kê") rồi hỏi: nhận xét/so sánh, tính TỈ TRỌNG (%), TỐC ĐỘ TĂNG TRƯỞNG (%),
  hoặc CHỌN DẠNG BIỂU ĐỒ THÍCH HỢP NHẤT (cột, đường, tròn, miền, kết hợp) để thể hiện số liệu. Trình bày
  bảng số liệu trong "content" dạng văn bản căn cột đơn giản.
- NHÓM BIỂU ĐỒ (BẮT BUỘC CÓ): ÍT NHẤT 2-3 câu DỰA TRÊN BIỂU ĐỒ. Với các câu này, THÊM trường "chart"
  để hệ thống vẽ biểu đồ thật, rồi hỏi NHẬN XÉT/PHÂN TÍCH biểu đồ (xu hướng tăng/giảm, so sánh, năm cao/thấp
  nhất, tính tỉ trọng). Cấu trúc chart:
  { "type":"bar"|"line"|"pie"|"area"|"combo", "title":"Tên biểu đồ", "unit":"%",
    "categories":["2018","2019","2020","2021"],
    "series":[ {"name":"Công nghiệp","type":"bar","data":[10,12,15,18]},
               {"name":"Dịch vụ","type":"line","data":[40,42,45,48]} ] }
  • type "pie" (cơ cấu/tỉ trọng): dùng 1 series, mỗi giá trị ứng 1 category, đơn vị %.
  • type "line"/"area": thể hiện thay đổi theo thời gian; "bar": so sánh; "combo": cột + đường (đặt "type" trong từng series).
  • Số liệu thực tế, hợp lí, nhất quán với câu hỏi và đáp án. Câu CÓ "chart" thì KHÔNG cần lặp lại bảng số liệu dài.
- NHÓM KIẾN THỨC: địa lí tự nhiên (vị trí, địa hình, khí hậu, sông ngòi, đất, sinh vật), dân cư - xã hội,
  các ngành kinh tế (nông nghiệp, công nghiệp, dịch vụ), các vùng kinh tế — đúng chương trình lớp ${config.grade}.
- NHÓM GIẢI THÍCH (câu mức cao): hỏi "Vì sao...", giải thích nguyên nhân tự nhiên/kinh tế - xã hội.
- CÂU TỰ LUẬN: cho bảng số liệu → yêu cầu NHẬN XÉT và GIẢI THÍCH; hoặc trình bày/giải thích đặc điểm
  một đối tượng địa lí. "modelAnswer" nêu các ý chính kèm số liệu dẫn chứng.
- KHÔNG dùng trường "figure" (môn Địa lí dùng Atlat và bảng số liệu, không vẽ hình hình học).`,
    };
  }

  return { language: '- Dùng tiếng Việt chuẩn, có dấu.', block: '' };
}

function buildGenerationPrompt(
  config: ExamGenConfig,
  blueprint: ExamBlueprint,
  setNum: number
): string {
  const levelKeys = getLevels(config.grade)
    .map((l) => l.key)
    .join(' | ');

  const guidance = getSubjectGuidance(config, blueprint);
  const subjectBlock = guidance.block ? `\n${guidance.block}\n` : '';

  return `Hãy tạo một ĐỀ THI môn "${config.subject}" cho học sinh LỚP ${config.grade} tại Việt Nam.
Phạm vi nội dung (Bài học/Chương): ${config.chapter}.
Đây là MÃ ĐỀ thứ ${setNum + 1} trong ${config.setCount} mã đề — nội dung phải KHÁC các mã đề khác (có thể đảo thứ tự, thay số liệu, thay ngữ cảnh).

PHÂN BỔ THEO MỨC ĐỘ TƯ DUY (BẮT BUỘC đúng số lượng):
${blueprintToText(blueprint)}

Tổng: ${blueprint.totalMcq} câu trắc nghiệm + ${blueprint.totalEssay} câu tự luận = ${blueprint.total} câu.
${subjectBlock}
YÊU CẦU:
- Nội dung bám sát chương trình giáo dục phổ thông hiện hành, phù hợp trình độ lớp ${config.grade}.
- KHÔNG trùng lặp nội dung giữa các câu.
- Mỗi câu trắc nghiệm có ĐÚNG 4 phương án A, B, C, D và CHỈ 1 đáp án đúng.
- Đáp án đúng PHÂN BỐ NGẪU NHIÊN, cân bằng giữa A/B/C/D (không dồn vào một phương án).
- Đáp án phải CHÍNH XÁC. Mỗi câu kèm lời giải/giải thích chi tiết, rõ ràng (vì sao đúng,
  vì sao các phương án còn lại sai).
- CÂU TỰ LUẬN PHẢI KHÓ, ở mức VẬN DỤNG / VẬN DỤNG CAO: bài tập tính toán, chứng minh,
  phân tích, giải quyết vấn đề/tình huống thực tế. TUYỆT ĐỐI KHÔNG hỏi định nghĩa,
  khái niệm, "nêu/trình bày" lý thuyết suông (vì quá dễ). Mỗi câu tự luận kèm đáp án
  mẫu (model answer) giải chi tiết theo bước.
- KHÔNG tự chấm điểm cho câu (hệ thống sẽ tự chia điểm), KHÔNG thêm trường "points".
- CÔNG THỨC TOÁN/KÝ HIỆU: viết bằng ký hiệu THƯỜNG, dễ đọc; TUYỆT ĐỐI KHÔNG dùng LaTeX
  hay dấu gạch chéo ngược (\\). Ví dụ: lũy thừa viết x^2 hoặc x², phân số viết a/b hoặc
  (a+b)/(2a), căn bậc hai viết √(2), vectơ viết "vectơ AB", góc ABC, tam giác ABC; dùng
  trực tiếp các ký hiệu ≤ ≥ ≠ ± × ÷ → ∈ ⊥ ∥. KHÔNG viết \\frac, \\sqrt, dấu $ hay \\(.
- HÌNH VẼ: CHỈ thêm trường "figure" khi câu thực sự cần hình minh hoạ (hình học phẳng/toạ độ).
  figure = { "points":[{"name":"A","x":1,"y":2}], "segments":[["A","B"],["B","C"]],
  "polygons":[["A","B","C"]], "circles":[{"x":5,"y":5,"r":3}] } với toạ độ x,y trong khoảng 0..10.
  Câu KHÔNG cần hình thì BỎ trường figure. KHÔNG chèn ảnh.
- "cognitiveLevel" phải là một trong: ${levelKeys}.
${guidance.language}

Trả về DUY NHẤT một object JSON theo đúng cấu trúc sau (không thêm chữ nào ngoài JSON):
{
  "questions": [
    {
      "questionNumber": 1,
      "type": "mcq",
      "cognitiveLevel": "${blueprint.levels[0].key}",
      "content": "Nội dung câu hỏi",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correctAnswer": "A",
      "explanation": "Lời giải chi tiết vì sao chọn A"
    },
    {
      "questionNumber": ${config.mcqCount + 1},
      "type": "essay",
      "cognitiveLevel": "${blueprint.levels[blueprint.levels.length - 1].key}",
      "content": "Nội dung câu tự luận",
      "modelAnswer": "Đáp án mẫu / lời giải chi tiết",
      "explanation": "Hướng dẫn chấm"
    }
  ]
}

LƯU Ý: Đặt tất cả câu TRẮC NGHIỆM trước (đánh số 1..${config.mcqCount}), sau đó đến câu TỰ LUẬN (đánh số tiếp theo).`;
}

function parseQuestions(
  response: string,
  config: ExamGenConfig
): GeneratedQuestion[] {
  let parsed: any;
  try {
    // Ưu tiên parse trực tiếp (JSON mode), fallback trích object đầu tiên.
    parsed = JSON.parse(response);
  } catch {
    const match = response.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI không trả về JSON hợp lệ.');
    parsed = JSON.parse(match[0]);
  }

  const raw: any[] = Array.isArray(parsed)
    ? parsed
    : parsed.questions || parsed.cauHoi || [];

  if (!raw.length) {
    throw new Error('AI không tạo được câu hỏi nào.');
  }

  // Chuẩn hoá: trắc nghiệm trước, tự luận sau; đánh số lại liên tục.
  const mcq = raw.filter((q) => (q.type || 'mcq') === 'mcq');
  const essay = raw.filter((q) => q.type === 'essay');
  const ordered = [...mcq, ...essay];

  return ordered.map((q, idx) => {
    const type: 'mcq' | 'essay' = q.type === 'essay' ? 'essay' : 'mcq';
    const options =
      type === 'mcq' && q.options
        ? {
            A: String(q.options.A ?? ''),
            B: String(q.options.B ?? ''),
            C: String(q.options.C ?? ''),
            D: String(q.options.D ?? ''),
          }
        : undefined;

    return {
      questionNumber: idx + 1,
      type,
      cognitiveLevel: String(q.cognitiveLevel || q.level || ''),
      content: String(q.content || q.question || ''),
      options,
      correctAnswer:
        type === 'mcq'
          ? String(q.correctAnswer || q.answer || '').trim().toUpperCase().charAt(0)
          : undefined,
      explanation: q.explanation ? String(q.explanation) : undefined,
      modelAnswer: q.modelAnswer ? String(q.modelAnswer) : undefined,
      figure: q.figure && typeof q.figure === 'object' ? q.figure : undefined,
      chart: q.chart && typeof q.chart === 'object' ? q.chart : undefined,
      points:
        typeof q.points === 'number'
          ? q.points
          : type === 'essay'
            ? 2
            : 1,
    };
  });
}

export async function saveExamSetsToDatabase(
  config: ExamGenConfig,
  examSets: GeneratedExamSet[],
  teacherId: string,
  classroomId: string | null
) {
  const savedSets: { id: string; setCode: string; questionCount: number }[] = [];

  // Phân bổ thang điểm hiệu lực (tổng = mcqPoints + essayPoints, vd 10).
  // Nếu chỉ có một phần thì phần đó nhận trọn tổng điểm.
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const totalPoints = config.mcqPoints + config.essayPoints;
  const hasMcq = config.mcqCount > 0;
  const hasEssay = config.essayCount > 0;
  const effMcqPoints = hasMcq ? (hasEssay ? config.mcqPoints : totalPoints) : 0;
  const effEssayPoints = hasEssay ? (hasMcq ? config.essayPoints : totalPoints) : 0;
  const perMcq = hasMcq ? round2(effMcqPoints / config.mcqCount) : 1;
  const perEssay = hasEssay ? round2(effEssayPoints / config.essayCount) : 1;

  for (const examSet of examSets) {
    const { data: createdSet, error: setError } = await supabaseAdmin
      .from('exam_sets')
      .insert([
        {
          classroom_id: classroomId,
          name: `${config.header.title || config.subject} - Mã đề ${examSet.setCode}`,
          set_code: examSet.setCode,
          subject: config.subject,
          grade: config.grade,
          chapter: config.chapter,
          duration_minutes: config.durationMinutes,
          mcq_count: config.mcqCount,
          essay_count: config.essayCount,
          mcq_points: effMcqPoints,
          essay_points: effEssayPoints,
          question_count: examSet.questions.length,
          department: config.header.department || null,
          school: config.header.school || null,
          title: config.header.title || null,
          school_year: config.header.schoolYear || null,
          created_by: teacherId,
        },
      ])
      .select('id')
      .single();

    if (setError || !createdSet) {
      throw new Error(`Không tạo được mã đề: ${setError?.message}`);
    }

    const questionsRows = examSet.questions.map((q) => ({
      exam_set_id: createdSet.id,
      question_number: q.questionNumber,
      content: q.content,
      type: q.type,
      cognitive_level: q.cognitiveLevel || null,
      options: q.options || null,
      option_a: q.options?.A || null,
      option_b: q.options?.B || null,
      option_c: q.options?.C || null,
      option_d: q.options?.D || null,
      correct_answer: q.correctAnswer || null,
      explanation: q.explanation || null,
      model_answer: q.modelAnswer || null,
      figure: q.figure || null,
      chart: q.chart || null,
      points: q.type === 'essay' ? perEssay : perMcq,
    }));

    const { error: qError } = await supabaseAdmin
      .from('questions')
      .insert(questionsRows);

    if (qError) {
      throw new Error(`Không lưu được câu hỏi: ${qError.message}`);
    }

    const { error: keyError } = await supabaseAdmin.from('answer_keys').insert([
      {
        exam_set_id: createdSet.id,
        answers: examSet.answerKey,
        created_at: new Date().toISOString(),
      },
    ]);

    if (keyError) {
      throw new Error(`Không lưu được đáp án: ${keyError.message}`);
    }

    savedSets.push({
      id: createdSet.id,
      setCode: examSet.setCode,
      questionCount: examSet.questions.length,
    });
  }

  return { success: true as const, examSets: savedSets };
}