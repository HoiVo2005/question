import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';

// Danh sách bài nộp trong một bài thi (kèm số câu đúng + điểm).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roomId } = await params;

    // Phòng + lớp (để kiểm tra quyền)
    const { data: room } = await supabaseAdmin
      .from('exam_rooms')
      .select('id, name, classroom_id, classrooms(teacher_id, name)')
      .eq('id', roomId)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Không tìm thấy bài thi' }, { status: 404 });
    }
    const classroom: any = room.classrooms;
    if (classroom?.teacher_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: subs } = await supabaseAdmin
      .from('submissions')
      .select(
        `
        id,
        status,
        submitted_at,
        total_score,
        max_score,
        student_id,
        users(name, full_name, email),
        exam_sets(set_code, mcq_count, question_count),
        student_answers(is_correct)
      `
      )
      .eq('exam_room_id', roomId)
      .order('submitted_at', { ascending: false });

    const submissions = (subs || []).map((s: any) => {
      const u = s.users || {};
      const es = s.exam_sets || {};
      const answers = s.student_answers || [];
      const correctCount = answers.filter((a: any) => a.is_correct === true).length;
      const totalMcq = es.mcq_count || es.question_count || answers.length || 0;
      return {
        id: s.id,
        studentName: u.full_name || u.name || 'Học sinh',
        email: u.email,
        setCode: es.set_code,
        correctCount,
        totalQuestions: totalMcq,
        totalScore: s.total_score,
        maxScore: s.max_score,
        status: s.status,
        submittedAt: s.submitted_at,
      };
    });

    return NextResponse.json({
      roomName: room.name,
      classroomName: classroom?.name,
      submissions,
    });
  } catch (error) {
    console.error('Room submissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
