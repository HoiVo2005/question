import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';

async function assertOwner(classroomId: string, teacherId: string) {
  const { data } = await supabaseAdmin
    .from('classrooms')
    .select('teacher_id')
    .eq('id', classroomId)
    .single();
  return data && data.teacher_id === teacherId;
}

// Cập nhật bài thi.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ classroomId: string; roomId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { classroomId, roomId } = await params;
    if (!(await assertOwner(classroomId, session.user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (typeof body.name === 'string') update.name = body.name;
    if ('startTime' in body)
      update.start_time = body.startTime ? new Date(body.startTime).toISOString() : null;
    if ('endTime' in body)
      update.end_time = body.endTime ? new Date(body.endTime).toISOString() : null;
    if (Array.isArray(body.examSetIds)) {
      const ids = body.examSetIds.filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json(
          { error: 'Cần ít nhất một mã đề' },
          { status: 400 }
        );
      }
      update.exam_set_ids = ids;
    }

    const { error } = await supabaseAdmin
      .from('exam_rooms')
      .update(update)
      .eq('id', roomId)
      .eq('classroom_id', classroomId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Xoá bài thi.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classroomId: string; roomId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { classroomId, roomId } = await params;
    if (!(await assertOwner(classroomId, session.user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await supabaseAdmin
      .from('exam_rooms')
      .delete()
      .eq('id', roomId)
      .eq('classroom_id', classroomId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
