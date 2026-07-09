import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createNotifications } from '@/lib/notify-server';
import { formatDateVi } from '@/lib/format';

function genCode(len = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function uniqueRoomCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = genCode();
    const { data } = await supabaseAdmin
      .from('exam_rooms')
      .select('id')
      .eq('room_code', code)
      .maybeSingle();
    if (!data) return code;
  }
  return genCode(8);
}

async function assertOwner(classroomId: string, teacherId: string) {
  const { data } = await supabaseAdmin
    .from('classrooms')
    .select('teacher_id')
    .eq('id', classroomId)
    .single();
  return data && data.teacher_id === teacherId;
}

// Tạo bài thi mới trong lớp.
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
    const { name, startTime, endTime } = body;
    const examSetIds: string[] = Array.isArray(body.examSetIds)
      ? body.examSetIds.filter(Boolean)
      : [];

    if (examSetIds.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng chọn ít nhất một mã đề cho bài thi' },
        { status: 400 }
      );
    }

    const roomCode = await uniqueRoomCode();

    const { data, error } = await supabaseAdmin
      .from('exam_rooms')
      .insert([
        {
          classroom_id: classroomId,
          name: name ? String(name) : 'Bài thi',
          room_code: roomCode,
          exam_set_ids: examSetIds,
          start_time: startTime ? new Date(startTime).toISOString() : null,
          end_time: endTime ? new Date(endTime).toISOString() : null,
          created_by: session.user.id,
        },
      ])
      .select('id, name, room_code, start_time, end_time')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Không tạo được bài thi' },
        { status: 500 }
      );
    }

    // Thông báo cho học sinh trong lớp: có bài thi sắp diễn ra.
    try {
      const { data: members } = await supabaseAdmin
        .from('classroom_students')
        .select('student_id')
        .eq('classroom_id', classroomId);
      const studentIds = (members || []).map((m: any) => m.student_id);
      const when = data.start_time
        ? ` Mở lúc ${formatDateVi(data.start_time)}.`
        : ' Có thể vào thi ngay.';
      await createNotifications(studentIds, {
        title: 'Sắp có bài thi',
        body: `Bài thi "${data.name}".${when} Nhập mã bài thi giáo viên cung cấp để vào thi.`,
        type: 'exam',
        link: '/student/join-exam',
      });
    } catch (e) {
      console.error('notify students error:', e);
    }

    return NextResponse.json(
      {
        id: data.id,
        name: data.name,
        roomCode: data.room_code,
        startTime: data.start_time,
        endTime: data.end_time,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
