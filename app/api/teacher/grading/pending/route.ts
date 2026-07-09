import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all submissions for this teacher's classrooms that need grading
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select(
        `
        id,
        submitted_at,
        total_score,
        max_score,
        users(full_name),
        exam_sets(
          name,
          classroom_id,
          classrooms(name, teacher_id),
          questions(
            id,
            type
          )
        )
      `
      )
      .eq('exam_sets.classrooms.teacher_id', session.user.id)
      .in('status', ['submitted', 'in_progress'])
      .order('submitted_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformed = data.map((item: any) => {
      const essayCount = item.exam_sets.questions.filter(
        (q: any) => q.type === 'essay'
      ).length;

      return {
        id: item.id,
        studentName: item.users.full_name,
        examName: item.exam_sets.name,
        classroomName: item.exam_sets.classrooms.name,
        submittedAt: item.submitted_at,
        mcqScore: item.total_score || 0,
        essayCount,
      };
    });

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
