import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomCode } = await request.json();

    if (!roomCode) {
      return NextResponse.json({ error: 'Vui lòng nhập mã bài thi' }, { status: 400 });
    }

    // 1) Tìm bài thi theo mã bài thi
    const { data: room, error: roomError } = await supabaseAdmin
      .from('exam_rooms')
      .select('id, classroom_id, exam_set_ids, start_time, end_time')
      .eq('room_code', String(roomCode).toUpperCase().trim())
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Không tìm thấy bài thi với mã này' },
        { status: 404 }
      );
    }

    // 2) Kiểm tra học sinh có thuộc lớp của bài thi không
    const { data: member } = await supabaseAdmin
      .from('classroom_students')
      .select('classroom_id')
      .eq('classroom_id', room.classroom_id)
      .eq('student_id', session.user.id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json(
        {
          error:
            'Bạn không thuộc lớp của bài thi này. Vui lòng liên hệ giáo viên để được thêm vào lớp.',
        },
        { status: 403 }
      );
    }

    // 3) Kiểm tra thời gian mở phòng
    const now = Date.now();
    const start = room.start_time ? new Date(room.start_time).getTime() : null;
    const end = room.end_time ? new Date(room.end_time).getTime() : null;
    if (start && now < start) {
      return NextResponse.json(
        { error: 'Chưa đến giờ thi. Vui lòng quay lại sau.' },
        { status: 403 }
      );
    }
    if (end && now > end) {
      return NextResponse.json({ error: 'Bài thi đã đóng.' }, { status: 403 });
    }

    const pool: string[] = (
      Array.isArray(room.exam_set_ids) ? room.exam_set_ids : []
    ).filter(Boolean);
    if (pool.length === 0) {
      return NextResponse.json(
        { error: 'Bài thi chưa có mã đề nào.' },
        { status: 400 }
      );
    }

    // 4) Đã có bài trong phòng này -> nối lại
    const { data: existing } = await supabaseAdmin
      .from('submissions')
      .select('id')
      .eq('exam_room_id', room.id)
      .eq('student_id', session.user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ submissionId: existing.id }, { status: 200 });
    }

    // 5) Gán NGẪU NHIÊN một mã đề
    const examSetId = pool[Math.floor(Math.random() * pool.length)];

    const { data: submission, error: submitError } = await supabaseAdmin
      .from('submissions')
      .insert([
        {
          exam_set_id: examSetId,
          exam_room_id: room.id,
          student_id: session.user.id,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        },
      ])
      .select('id')
      .single();

    if (submitError || !submission) {
      return NextResponse.json(
        { error: 'Không thể bắt đầu bài thi. Vui lòng thử lại.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ submissionId: submission.id }, { status: 201 });
  } catch (error) {
    console.error('Join exam error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
