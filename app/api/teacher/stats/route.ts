import { NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';

const round1 = (n: number) => Math.round(n * 10) / 10;

// Thống kê tổng hợp cho giáo viên: theo lớp & theo bài thi.
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const teacherId = session.user.id;

    // Lớp + số học sinh + bài thi
    const { data: classes } = await supabaseAdmin
      .from('classrooms')
      .select('id, name, classroom_students(count), exam_rooms(id, name)')
      .eq('teacher_id', teacherId);

    const classList = classes || [];

    // Map roomId -> {name, classId, className}
    const roomMap = new Map<string, { name: string; classId: string; className: string }>();
    for (const c of classList) {
      for (const r of (c as any).exam_rooms || []) {
        roomMap.set(r.id, { name: r.name, classId: c.id, className: c.name });
      }
    }
    const roomIds = [...roomMap.keys()];

    // Bài nộp trong các bài thi của giáo viên
    let submissions: any[] = [];
    if (roomIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('submissions')
        .select('total_score, max_score, status, exam_room_id')
        .in('exam_room_id', roomIds);
      submissions = data || [];
    }

    const score10 = (s: any) =>
      s.max_score ? ((s.total_score || 0) / s.max_score) * 10 : 0;
    const isGraded = (s: any) => s.status === 'graded';
    const bandOf = (d: number) =>
      d >= 8 ? 'gioi' : d >= 6.5 ? 'kha' : d >= 5 ? 'tb' : 'yeu';

    // ---- Theo lớp ----
    const byClass = classList.map((c: any) => {
      const classRoomIds = ((c.exam_rooms || []) as any[]).map((r) => r.id);
      const subs = submissions.filter(
        (s) => classRoomIds.includes(s.exam_room_id) && isGraded(s)
      );
      const avg =
        subs.length > 0
          ? round1(subs.reduce((sum, s) => sum + score10(s), 0) / subs.length)
          : 0;
      return {
        id: c.id,
        name: c.name,
        studentCount: c.classroom_students?.[0]?.count ?? 0,
        examCount: (c.exam_rooms || []).length,
        submissionCount: submissions.filter((s) =>
          classRoomIds.includes(s.exam_room_id)
        ).length,
        avg,
      };
    });

    // ---- Theo bài thi ----
    const byExam = roomIds
      .map((rid) => {
        const info = roomMap.get(rid)!;
        const subs = submissions.filter((s) => s.exam_room_id === rid);
        const graded = subs.filter(isGraded);
        const scores = graded.map(score10);
        const avg =
          scores.length > 0
            ? round1(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;
        const passRate =
          scores.length > 0
            ? Math.round((scores.filter((d) => d >= 5).length / scores.length) * 100)
            : 0;
        const bands = { gioi: 0, kha: 0, tb: 0, yeu: 0 };
        for (const d of scores) bands[bandOf(d) as keyof typeof bands]++;
        return {
          id: rid,
          name: info.name,
          className: info.className,
          submissionCount: subs.length,
          gradedCount: graded.length,
          avg,
          passRate,
          bands,
        };
      })
      .sort((a, b) => b.submissionCount - a.submissionCount);

    // ---- Phân loại học lực toàn bộ ----
    const overallBands = { gioi: 0, kha: 0, tb: 0, yeu: 0 };
    for (const s of submissions.filter(isGraded)) {
      overallBands[bandOf(score10(s)) as keyof typeof overallBands]++;
    }

    const totals = {
      classes: classList.length,
      students: byClass.reduce((s, c) => s + c.studentCount, 0),
      exams: roomIds.length,
      submissions: submissions.length,
      graded: submissions.filter(isGraded).length,
    };

    return NextResponse.json({ totals, byClass, byExam, overallBands });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
