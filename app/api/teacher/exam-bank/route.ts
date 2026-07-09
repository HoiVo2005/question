import { NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';

// Ngân hàng đề: các mã đề do giáo viên đã tạo (qua AI), dùng để gắn vào bài thi.
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('exam_sets')
      .select('id, name, set_code, subject, grade, question_count, created_at')
      .eq('created_by', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const examSets = (data || []).map((e: any) => ({
      id: e.id,
      name: e.name,
      setCode: e.set_code,
      subject: e.subject,
      grade: e.grade,
      questionCount: e.question_count,
    }));

    return NextResponse.json({ examSets });
  } catch (error) {
    console.error('Exam bank error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
