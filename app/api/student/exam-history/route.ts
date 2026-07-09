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

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select(
        `
        id,
        submitted_at,
        total_score,
        max_score,
        status,
        exam_sets(name),
        exam_rooms(name, classrooms(name))
      `
      )
      .eq('student_id', session.user.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformed = (data || [])
      // Chỉ hiển thị bài đã nộp / đã chấm
      .filter((item: any) => item.status === 'submitted' || item.status === 'graded')
      .map((item: any) => {
        const room = item.exam_rooms;
        return {
          id: item.id,
          examName: item.exam_sets?.name || room?.name || 'Bài thi',
          classroomName: room?.classrooms?.name || room?.name || '',
          submittedAt: item.submitted_at,
          score: item.total_score,
          maxScore: item.max_score,
          status: item.status === 'graded' ? 'graded' : 'pending',
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
