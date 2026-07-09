import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ submissionId: string }> }
) {
  const params = await paramsPromise;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: submission, error } = await supabaseAdmin
      .from('submissions')
      .select(
        `
        id,
        status,
        submitted_at,
        total_score,
        max_score,
        teacher_feedback,
        student_id,
        exam_sets(
          name,
          questions(
            id,
            question_number,
            content,
            type,
            correct_answer,
            explanation,
            model_answer,
            points,
            figure,
            chart
          )
        ),
        student_answers(
          question_id,
          selected_option,
          is_correct,
          earned_points,
          essay_image_url
        )
      `
      )
      .eq('id', params.submissionId)
      .single();

    if (error || !submission) {
      return NextResponse.json({ error: 'Không tìm thấy bài làm' }, { status: 404 });
    }

    if (submission.student_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const examSet: any = submission.exam_sets;
    const totalScore = submission.total_score || 0;
    const maxScore = submission.max_score || 0;
    const percentage = maxScore ? (totalScore / maxScore) * 100 : 0;

    const questions = [...(examSet?.questions || [])]
      .sort((a: any, b: any) => (a.question_number || 0) - (b.question_number || 0))
      .map((q: any) => ({
        id: q.id,
        questionNumber: q.question_number,
        questionText: q.content,
        type: q.type,
        figure: q.figure ?? null,
        chart: q.chart ?? null,
        points: q.points ?? (q.type === 'essay' ? 2 : 1),
        correctAnswer: q.correct_answer,
        explanation: q.type === 'essay' ? q.model_answer || q.explanation : q.explanation,
      }));

    const answers = (submission.student_answers || []).map((a: any) => ({
      questionId: a.question_id,
      selectedOption: a.selected_option,
      isCorrect: a.is_correct,
      earnedPoints: a.earned_points,
      essayImageUrl: a.essay_image_url,
    }));

    return NextResponse.json({
      examTitle: examSet?.name || 'Bài thi',
      totalScore,
      maxScore,
      percentage,
      grade: percentage >= 50 ? 'Đạt' : 'Chưa đạt',
      status: submission.status,
      submittedAt: submission.submitted_at,
      teacherFeedback: submission.teacher_feedback,
      questions,
      answers,
    });
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}
