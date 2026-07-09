import { supabaseAdmin } from './supabase/client';

export interface FullExamQuestion {
  questionNumber: number;
  type: 'mcq' | 'essay';
  cognitiveLevel: string | null;
  content: string;
  options: { A: string; B: string; C: string; D: string } | null;
  correctAnswer: string | null;
  explanation: string | null;
  modelAnswer: string | null;
  points: number | null;
  figure: any | null;
  chart: any | null;
}

export interface FullExam {
  id: string;
  setCode: string | null;
  subject: string | null;
  grade: number | null;
  chapter: string | null;
  durationMinutes: number | null;
  mcqCount: number | null;
  essayCount: number | null;
  department: string | null;
  school: string | null;
  title: string | null;
  schoolYear: string | null;
  createdBy: string | null;
  questions: FullExamQuestion[];
  answerKey: Record<string, string>;
}

/** Lấy toàn bộ dữ liệu một mã đề (header + câu hỏi đã sắp xếp + đáp án). */
export async function getFullExamSet(examSetId: string): Promise<FullExam | null> {
  const { data: set, error } = await supabaseAdmin
    .from('exam_sets')
    .select('*')
    .eq('id', examSetId)
    .single();

  if (error || !set) return null;

  const { data: qs } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('exam_set_id', examSetId)
    .order('question_number', { ascending: true });

  const { data: keyRow } = await supabaseAdmin
    .from('answer_keys')
    .select('answers')
    .eq('exam_set_id', examSetId)
    .single();

  const questions: FullExamQuestion[] = (qs || []).map((q: any) => {
    const options =
      q.options && typeof q.options === 'object'
        ? {
            A: String(q.options.A ?? q.option_a ?? ''),
            B: String(q.options.B ?? q.option_b ?? ''),
            C: String(q.options.C ?? q.option_c ?? ''),
            D: String(q.options.D ?? q.option_d ?? ''),
          }
        : q.option_a || q.option_b || q.option_c || q.option_d
          ? {
              A: String(q.option_a ?? ''),
              B: String(q.option_b ?? ''),
              C: String(q.option_c ?? ''),
              D: String(q.option_d ?? ''),
            }
          : null;

    return {
      questionNumber: q.question_number,
      type: q.type === 'essay' ? 'essay' : 'mcq',
      cognitiveLevel: q.cognitive_level ?? null,
      content: q.content ?? q.question_text ?? '',
      options,
      correctAnswer: q.correct_answer ?? null,
      explanation: q.explanation ?? null,
      modelAnswer: q.model_answer ?? null,
      points: q.points ?? null,
      figure: q.figure ?? null,
      chart: q.chart ?? null,
    };
  });

  return {
    id: set.id,
    setCode: set.set_code ?? null,
    subject: set.subject ?? null,
    grade: set.grade ?? null,
    chapter: set.chapter ?? null,
    durationMinutes: set.duration_minutes ?? null,
    mcqCount: set.mcq_count ?? null,
    essayCount: set.essay_count ?? null,
    department: set.department ?? null,
    school: set.school ?? null,
    title: set.title ?? null,
    schoolYear: set.school_year ?? null,
    createdBy: set.created_by ?? null,
    questions,
    answerKey: (keyRow?.answers as Record<string, string>) || {},
  };
}