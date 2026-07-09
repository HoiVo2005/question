import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';

// Chi tiết một lớp: thông tin + danh sách học sinh + danh sách bài thi.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { classroomId } = await params;

    const { data: classroom, error } = await supabaseAdmin
      .from('classrooms')
      .select('id, name, code, teacher_id, created_at')
      .eq('id', classroomId)
      .single();

    if (error || !classroom) {
      return NextResponse.json({ error: 'Không tìm thấy lớp' }, { status: 404 });
    }
    if (classroom.teacher_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Học sinh trong lớp
    const { data: studentRows } = await supabaseAdmin
      .from('classroom_students')
      .select('joined_at, users(id, name, full_name, email)')
      .eq('classroom_id', classroomId)
      .order('joined_at', { ascending: false });

    const students = (studentRows || []).map((r: any) => ({
      id: r.users?.id,
      name: r.users?.full_name || r.users?.name || 'Học sinh',
      email: r.users?.email,
      joinedAt: r.joined_at,
    }));

    // Bài thi của lớp
    const { data: roomRows } = await supabaseAdmin
      .from('exam_rooms')
      .select('id, name, room_code, exam_set_ids, start_time, end_time, created_at')
      .eq('classroom_id', classroomId)
      .order('created_at', { ascending: false });

    const now = Date.now();
    const rooms = (roomRows || []).map((r: any) => {
      const start = r.start_time ? new Date(r.start_time).getTime() : null;
      const end = r.end_time ? new Date(r.end_time).getTime() : null;
      let status: 'upcoming' | 'open' | 'closed' = 'open';
      if (start && now < start) status = 'upcoming';
      else if (end && now > end) status = 'closed';
      return {
        id: r.id,
        name: r.name,
        roomCode: r.room_code,
        examSetIds: Array.isArray(r.exam_set_ids) ? r.exam_set_ids : [],
        examSetCount: Array.isArray(r.exam_set_ids) ? r.exam_set_ids.length : 0,
        startTime: r.start_time,
        endTime: r.end_time,
        status,
        createdAt: r.created_at,
      };
    });

    return NextResponse.json({
      id: classroom.id,
      name: classroom.name,
      code: classroom.code,
      createdAt: classroom.created_at,
      students,
      rooms,
    });
  } catch (error) {
    console.error('Classroom detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Xoá lớp.
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

    const { data: classroom } = await supabaseAdmin
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classroomId)
      .single();

    if (!classroom || classroom.teacher_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await supabaseAdmin.from('classrooms').delete().eq('id', classroomId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete classroom error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
