import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { addStudentToClass } from '@/lib/classroom';

// Nhập danh sách học sinh vào lớp từ file Excel (danh sách EMAIL đã đăng ký).
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

    const { data: classroom } = await supabaseAdmin
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classroomId)
      .single();
    if (!classroom || classroom.teacher_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    // Chấp nhận { emails: [...] } hoặc { students: [{ email, fullName? }] }
    const rows: { email: string; fullName?: string }[] = Array.isArray(body.emails)
      ? body.emails.map((e: string) => ({ email: String(e) }))
      : Array.isArray(body.students)
        ? body.students.map((s: any) => ({
            email: String(s.email || ''),
            fullName: s.fullName ? String(s.fullName) : '',
          }))
        : [];

    const cleaned = rows
      .map((r) => ({ email: r.email.toLowerCase().trim(), fullName: r.fullName || '' }))
      .filter((r) => r.email.includes('@'));

    if (cleaned.length === 0) {
      return NextResponse.json(
        { error: 'Không tìm thấy email hợp lệ trong file' },
        { status: 400 }
      );
    }

    let imported = 0;
    const failed: string[] = [];

    for (const r of cleaned) {
      const res = await addStudentToClass(classroomId, r.email);
      if ('error' in res) failed.push(r.email);
      else imported++;
    }

    return NextResponse.json({
      imported,
      total: cleaned.length,
      failed,
    });
  } catch (error) {
    console.error('Import students error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
