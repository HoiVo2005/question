import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';
import { addStudentToClass } from '@/lib/classroom';

async function assertOwner(classroomId: string, teacherId: string) {
  const { data } = await supabaseAdmin
    .from('classrooms')
    .select('teacher_id')
    .eq('id', classroomId)
    .single();
  return data && data.teacher_id === teacherId;
}

// Thêm học sinh vào lớp theo email.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { classroomId } = await params;
    if (!(await assertOwner(classroomId, session.user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const email = String(body.email || '').toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ error: 'Vui lòng nhập email học sinh' }, { status: 400 });
    }

    const result = await addStudentToClass(classroomId, email);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.student, { status: 201 });
  } catch (error) {
    console.error('Add student error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Xoá học sinh khỏi lớp.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { classroomId } = await params;
    if (!(await assertOwner(classroomId, session.user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) {
      return NextResponse.json({ error: 'Thiếu studentId' }, { status: 400 });
    }

    await supabaseAdmin
      .from('classroom_students')
      .delete()
      .eq('classroom_id', classroomId)
      .eq('student_id', studentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove student error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
