import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ examId: string; questionId: string }> }
) {
    const params = await paramsPromise;
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify exam belongs to teacher
    const { data: exam } = await supabaseAdmin
      .from('exam_sets')
      .select('classroom_id')
      .eq('id', params.examId)
      .single();

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const { data: classroom } = await supabaseAdmin
      .from('classrooms')
      .select('teacher_id')
      .eq('id', exam.classroom_id)
      .single();

    if (classroom?.teacher_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from('questions')
      .delete()
      .eq('id', params.questionId)
      .eq('exam_set_id', params.examId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Question deleted' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
