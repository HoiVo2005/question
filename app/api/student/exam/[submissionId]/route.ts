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

    // Get submission with exam and questions
    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select(
        `
        id,
        started_at,
        exam_sets(
          id,
          name,
          start_time,
          end_time,
          duration_minutes,
          questions(
            id,
            question_number,
            content,
            type,
            options,
            option_a,
            option_b,
            option_c,
            option_d,
            figure,
            chart
          )
        )
      `
      )
      .eq('id', params.submissionId)
      .eq('student_id', session.user.id)
      .single();

    if (subError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const examSet = submission.exam_sets;

    const questions = [...(examSet.questions || [])]
      .sort((a: any, b: any) => (a.question_number || 0) - (b.question_number || 0))
      .map((q: any) => {
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
          id: q.id,
          questionNumber: q.question_number,
          content: q.content,
          type: q.type,
          options,
          figure: q.figure ?? null,
          chart: q.chart ?? null,
        };
      });

    return NextResponse.json({
      id: examSet.id,
      name: examSet.name,
      startTime: examSet.start_time,
      endTime: examSet.end_time,
      durationMinutes: examSet.duration_minutes,
      startedAt: (submission as any).started_at,
      questions,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
