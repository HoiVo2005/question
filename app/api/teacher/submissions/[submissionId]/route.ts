import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';

const round2 = (n: number) => Math.round(n * 100) / 100;

async function ownerCheck(submissionId: string, teacherId: string) {
  const { data } = await supabaseAdmin
    .from('submissions')
    .select('id, exam_rooms(classrooms(teacher_id))')
    .eq('id', submissionId)
    .single();
  if (!data) return { ok: false as const, status: 404 };
  const tid = (data as any).exam_rooms?.classrooms?.teacher_id;
  return { ok: tid === teacherId, status: tid === teacherId ? 200 : 403 };
}

// Chi tiết bài nộp để chấm (gồm đáp án + bài làm tự luận của học sinh).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { submissionId } = await params;

    const { data: s, error } = await supabaseAdmin
      .from('submissions')
      .select(
        `
        id, status, total_score, max_score, submitted_at,
        users(name, full_name, email),
        exam_rooms(name, classrooms(teacher_id)),
        exam_sets(name,
          questions(id, question_number, content, type, correct_answer, explanation, model_answer, points, figure, chart)
        ),
        student_answers(question_id, selected_option, is_correct, earned_points, essay_image_url, essay_text)
      `
      )
      .eq('id', submissionId)
      .single();

    if (error || !s) {
      return NextResponse.json({ error: 'Không tìm thấy bài nộp' }, { status: 404 });
    }
    const teacherId = (s as any).exam_rooms?.classrooms?.teacher_id;
    if (teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const u: any = s.users || {};
    const examSet: any = s.exam_sets || {};
    const ansByQ = new Map<string, any>();
    for (const a of s.student_answers || []) ansByQ.set((a as any).question_id, a);

    const questions = [...(examSet.questions || [])]
      .sort((a: any, b: any) => (a.question_number || 0) - (b.question_number || 0))
      .map((q: any) => {
        const a = ansByQ.get(q.id) || {};
        return {
          id: q.id,
          questionNumber: q.question_number,
          content: q.content,
          type: q.type,
          figure: q.figure ?? null,
          chart: q.chart ?? null,
          points: q.points ?? 1,
          correctAnswer: q.correct_answer,
          explanation: q.type === 'essay' ? q.model_answer || q.explanation : q.explanation,
          selectedOption: a.selected_option ?? null,
          isCorrect: a.is_correct ?? null,
          earnedPoints: a.earned_points ?? null,
          essayImageUrl: a.essay_image_url ?? null,
          essayText: a.essay_text ?? null,
        };
      });

    const mcq = questions.filter((q) => q.type === 'mcq');
    return NextResponse.json({
      id: s.id,
      studentName: u.full_name || u.name || 'Học sinh',
      email: u.email,
      examTitle: examSet.name || 'Bài thi',
      roomName: (s as any).exam_rooms?.name || '',
      status: s.status,
      totalScore: s.total_score,
      maxScore: s.max_score,
      submittedAt: s.submitted_at,
      mcqCorrect: mcq.filter((q) => q.isCorrect === true).length,
      mcqTotal: mcq.length,
      questions,
    });
  } catch (error) {
    console.error('Get submission detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Nhập/sửa điểm: hoặc đặt tổng điểm trực tiếp, hoặc nhập điểm từng câu tự luận.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { submissionId } = await params;

    const chk = await ownerCheck(submissionId, session.user.id);
    if (!chk.ok) {
      return NextResponse.json(
        { error: chk.status === 404 ? 'Không tìm thấy bài nộp' : 'Unauthorized' },
        { status: chk.status }
      );
    }

    const body = await request.json();

    // Cách 1: nhập điểm từng câu tự luận -> cập nhật rồi tính tổng = cộng điểm các câu.
    if (body.essayScores && typeof body.essayScores === 'object') {
      for (const [questionId, pts] of Object.entries(body.essayScores)) {
        await supabaseAdmin
          .from('student_answers')
          .update({ earned_points: round2(Number(pts) || 0) })
          .eq('submission_id', submissionId)
          .eq('question_id', questionId);
      }
      const { data: rows } = await supabaseAdmin
        .from('student_answers')
        .select('earned_points')
        .eq('submission_id', submissionId);
      const total = round2(
        (rows || []).reduce((s: number, r: any) => s + (Number(r.earned_points) || 0), 0)
      );
      const { error } = await supabaseAdmin
        .from('submissions')
        .update({ total_score: total, status: 'graded' })
        .eq('id', submissionId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, totalScore: total });
    }

    // Cách 2: đặt tổng điểm trực tiếp.
    const update: Record<string, unknown> = { status: body.status || 'graded' };
    if (body.totalScore !== undefined && body.totalScore !== null && body.totalScore !== '') {
      update.total_score = round2(Number(body.totalScore));
    }
    const { error } = await supabaseAdmin
      .from('submissions')
      .update(update)
      .eq('id', submissionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Set score error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
