import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { db } from '@/db/client';
import { exams } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ examId: string }> }
) {
    const params = await paramsPromise;
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('exam_sets')
      .select(
        `
        id,
        name,
        set_code,
        classroom_id,
        created_at,
        classrooms(name)
      `
      )
      .eq('id', params.examId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Verify classroom belongs to teacher
    const { data: classroom } = await supabaseAdmin
      .from('classrooms')
      .select('teacher_id')
      .eq('id', data.classroom_id)
      .single();

    if (classroom?.teacher_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      setCode: data.set_code,
      classroomId: data.classroom_id,
      classroomName: data.classrooms.name,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ examId: string }> }
) {
    const params = await paramsPromise;
  try {
    const examId = params.examId;

    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      );
    }

    await db.delete(exams).where(eq(exams.id, examId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete exam error:', error);
    return NextResponse.json(
      { error: 'Failed to delete exam' },
      { status: 500 }
    );
  }
}
