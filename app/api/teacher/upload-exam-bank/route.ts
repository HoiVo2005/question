import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Lấy văn bản thô từ file Word/PDF.
async function getRawText(ext: string, buffer: Buffer): Promise<string> {
  if (ext === 'pdf') {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    return result.text || '';
  }
  const mammoth = (await import('mammoth')).default;
  return (await mammoth.extractRawText({ buffer })).value || '';
}

// Dùng AI bóc tách câu hỏi từ văn bản đề tự do (Word/PDF tải trên mạng).
async function extractWithAI(rawText: string): Promise<ParsedQ[]> {
  if (!process.env.GROQ_API_KEY) return [];
  const text = rawText.slice(0, 16000); // giới hạn độ dài
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    max_tokens: 8000,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Bạn là công cụ trích xuất câu hỏi từ đề thi. Chỉ trả về JSON hợp lệ.',
      },
      {
        role: 'user',
        content: `Trích xuất TẤT CẢ câu hỏi từ nội dung đề thi dưới đây thành JSON.
- Mỗi câu: { "type": "mcq"|"essay", "content": "nội dung câu hỏi", "optionA","optionB","optionC","optionD" (nếu trắc nghiệm), "correct": "A"|"B"|"C"|"D" (nếu xác định được đáp án, nếu không thì bỏ trống) }.
- Giữ nguyên công thức bằng ký hiệu thường (x^2, a/b, √, ≤, ≥...), KHÔNG dùng LaTeX hay dấu gạch chéo ngược.
- HÌNH HỌC: nếu câu có hình (tam giác, đường tròn, toạ độ...), suy ra toạ độ hợp lý và thêm trường "figure" để hệ thống tự vẽ lại. figure = { "points":[{"name":"A","x":1,"y":2}], "segments":[["A","B"],["B","C"]], "polygons":[["A","B","C"]], "circles":[{"x":5,"y":5,"r":3}] } (toạ độ trong khoảng 0..10). Nếu câu không có hình thì BỎ trường figure.
- Trả về DUY NHẤT: { "questions": [ ... ] }

NỘI DUNG ĐỀ:
"""
${text}
"""`,
      },
    ],
  });
  const out = completion.choices[0]?.message?.content || '';
  let parsed: any;
  try {
    parsed = JSON.parse(out);
  } catch {
    const m = out.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : { questions: [] };
  }
  const arr: any[] = parsed.questions || parsed.cauHoi || [];
  return arr.map((q, i) => ({
    questionNumber: i + 1,
    content: String(q.content || q.question || ''),
    type: q.type === 'essay' ? 'essay' : 'mcq',
    optionA: val(q.optionA ?? q.A),
    optionB: val(q.optionB ?? q.B),
    optionC: val(q.optionC ?? q.C),
    optionD: val(q.optionD ?? q.D),
    correct: val(q.correct ?? q.correctAnswer ?? q.answer),
    figure: q.figure && typeof q.figure === 'object' ? q.figure : undefined,
    chart: q.chart && typeof q.chart === 'object' ? q.chart : undefined,
  }));
}

interface ParsedQ {
  questionNumber: number;
  content: string;
  type: 'mcq' | 'essay';
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correct?: string;
  figure?: any;
  chart?: any;
}

// Đọc Excel với đầy đủ cột (gồm đáp án đúng).
function parseExcelFull(buffer: Buffer): ParsedQ[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);
  return rows.map((row, i) => {
    const get = (...keys: string[]) => {
      for (const k of Object.keys(row)) {
        if (keys.some((x) => k.trim().toLowerCase() === x.toLowerCase())) return row[k];
      }
      return undefined;
    };
    const typeRaw = String(get('Loại', 'Type', 'Loai') || '').toLowerCase();
    const type: 'mcq' | 'essay' =
      typeRaw.includes('tự') || typeRaw.includes('essay') ? 'essay' : 'mcq';
    return {
      questionNumber: Number(get('Câu', 'Question', 'No', 'STT')) || i + 1,
      content: String(get('Nội dung', 'Nội Dung', 'Content', 'Question', 'Câu hỏi') || ''),
      type,
      optionA: val(get('A', 'Option A', 'Đáp án A')),
      optionB: val(get('B', 'Option B', 'Đáp án B')),
      optionC: val(get('C', 'Option C', 'Đáp án C')),
      optionD: val(get('D', 'Option D', 'Đáp án D')),
      correct: val(get('Đáp án', 'Đáp Án', 'Correct', 'Answer', 'Đáp án đúng')),
    };
  });
}

function val(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s || undefined;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get('file') as File | null;
    const title = String(form.get('title') || '').trim();
    const subject = String(form.get('subject') || '').trim();
    const grade = Number(form.get('grade')) || null;

    if (!file) {
      return NextResponse.json({ error: 'Vui lòng chọn file đề' }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: 'Vui lòng nhập tên đề' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let parsed: ParsedQ[] = [];
    if (ext === 'xlsx' || ext === 'xls') {
      parsed = parseExcelFull(buffer);
    } else if (ext === 'pdf' || ext === 'docx' || ext === 'doc') {
      // Lấy văn bản thô rồi dùng AI bóc tách đầy đủ (nội dung + phương án + đáp án).
      let rawText = '';
      try {
        rawText = await getRawText(ext, buffer);
      } catch (e) {
        console.error('Read file error:', e);
        return NextResponse.json(
          {
            error:
              'Không đọc được nội dung file. PDF dạng ảnh quét sẽ không đọc được — hãy dùng file Word (.docx) có chữ, hoặc mẫu Excel.',
          },
          { status: 400 }
        );
      }
      if (rawText.trim().length === 0) {
        return NextResponse.json(
          { error: 'File không có nội dung văn bản (có thể là ảnh quét).' },
          { status: 400 }
        );
      }
      parsed = await extractWithAI(rawText);
    } else {
      return NextResponse.json(
        { error: 'Định dạng không hỗ trợ. Dùng Excel (.xlsx), Word (.docx) hoặc PDF.' },
        { status: 400 }
      );
    }

    parsed = parsed.filter((q) => q.content && q.content.trim());
    if (parsed.length === 0) {
      return NextResponse.json(
        {
          error:
            'Không đọc được câu hỏi nào từ file. Hãy thử lại, hoặc dùng Excel với các cột: Câu, Nội dung, Loại, A, B, C, D, Đáp án. (Nếu dùng AI bóc tách, có thể đã hết hạn mức Groq trong ngày.)',
        },
        { status: 400 }
      );
    }

    // Tạo mã đề trong ngân hàng
    const setCode = String(Math.floor(1000 + Math.random() * 9000));
    const { data: createdSet, error: setErr } = await supabaseAdmin
      .from('exam_sets')
      .insert([
        {
          name: title,
          set_code: setCode,
          subject: subject || 'Khác',
          grade,
          question_count: parsed.length,
          created_by: session.user.id,
        },
      ])
      .select('id')
      .single();

    if (setErr || !createdSet) {
      return NextResponse.json(
        { error: setErr?.message || 'Không tạo được đề' },
        { status: 500 }
      );
    }

    const answerKey: Record<number, string> = {};
    const rows = parsed.map((q, idx) => {
      const num = q.questionNumber || idx + 1;
      const options =
        q.type === 'mcq'
          ? {
              A: q.optionA || '',
              B: q.optionB || '',
              C: q.optionC || '',
              D: q.optionD || '',
            }
          : null;
      const correct = q.correct
        ? q.correct.trim().toUpperCase().charAt(0)
        : null;
      if (q.type === 'mcq' && correct) answerKey[num] = correct;
      return {
        exam_set_id: createdSet.id,
        question_number: num,
        content: q.content,
        type: q.type,
        options,
        option_a: q.optionA || null,
        option_b: q.optionB || null,
        option_c: q.optionC || null,
        option_d: q.optionD || null,
        correct_answer: correct,
        points: q.type === 'essay' ? 2 : 1,
        figure: q.figure || null,
        chart: q.chart || null,
      };
    });

    const { error: qErr } = await supabaseAdmin.from('questions').insert(rows);
    if (qErr) {
      return NextResponse.json({ error: qErr.message }, { status: 500 });
    }

    await supabaseAdmin.from('answer_keys').insert([
      { exam_set_id: createdSet.id, answers: answerKey },
    ]);

    return NextResponse.json(
      {
        id: createdSet.id,
        setCode,
        questionCount: parsed.length,
        hasAnswers: Object.keys(answerKey).length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload exam bank error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải lên: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

