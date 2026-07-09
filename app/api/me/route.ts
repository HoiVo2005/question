import { NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';

// Thông tin tài khoản hiện tại + lớp (đối với học sinh).
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as {
      id: string;
      name?: string;
      email?: string;
      role?: string;
    };

    let classes: { name: string; code: string }[] = [];
    if (user.role !== 'teacher') {
      const { data } = await supabaseAdmin
        .from('classroom_students')
        .select('classrooms(name, code)')
        .eq('student_id', user.id);
      classes = (data || [])
        .map((r: any) => r.classrooms)
        .filter(Boolean)
        .map((c: any) => ({ name: c.name, code: c.code }));
    }

    return NextResponse.json({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'student',
      classes,
    });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
