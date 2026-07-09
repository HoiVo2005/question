import { NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';

const round1 = (n: number) => Math.round(n * 10) / 10;

// Bảng điểm theo lớp: mỗi lớp -> các đợt bài kiểm tra -> xếp hạng học sinh.
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const teacherId = session.user.id;

    const { data: classesData } = await supabaseAdmin
      .from('classrooms')
      .select('id, name, exam_rooms(id, name, created_at)')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    const classes = classesData || [];

    // Tất cả room ids
    const roomMeta = new Map<string, { name: string; classId: string }>();
    for (const c of classes) {
      for (const r of ((c as any).exam_rooms || [])) {
        roomMeta.set(r.id, { name: r.name, classId: c.id });
      }
    }
    const roomIds = [...roomMeta.keys()];

    let submissions: any[] = [];
    if (roomIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('submissions')
        .select(
          'exam_room_id, total_score, max_score, status, users(name, full_name)'
        )
        .in('exam_room_id', roomIds);
      submissions = data || [];
    }

    // Gom theo room
    const byRoom = new Map<string, any[]>();
    for (const s of submissions) {
      const arr = byRoom.get(s.exam_room_id) || [];
      const u: any = s.users || {};
      const graded = s.status === 'graded';
      const score = graded && s.max_score ? round1((s.total_score / s.max_score) * 10) : null;
      arr.push({
        name: u.full_name || u.name || 'Học sinh',
        score,
        status: s.status,
      });
      byRoom.set(s.exam_room_id, arr);
    }

    const result = classes.map((c: any) => {
      const rooms = ((c.exam_rooms || []) as any[])
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .map((r) => {
          const rows = (byRoom.get(r.id) || []).slice().sort((a, b) => {
            // Đã chấm (có điểm) lên trước, điểm cao -> thấp; chưa chấm xuống cuối.
            if (a.score == null && b.score == null) return 0;
            if (a.score == null) return 1;
            if (b.score == null) return -1;
            return b.score - a.score;
          });
          return { id: r.id, name: r.name, rows };
        });
      return { id: c.id, name: c.name, rooms };
    });

    return NextResponse.json({ classes: result });
  } catch (error) {
    console.error('Ranking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
