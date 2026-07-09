import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';

function genCode(len = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ ký tự dễ nhầm
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function uniqueClassroomCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = genCode();
    const { data } = await supabaseAdmin
      .from('classrooms')
      .select('id')
      .eq('code', code)
      .maybeSingle();
    if (!data) return code;
  }
  return genCode(8);
}

// Liệt kê lớp của giáo viên + số học sinh + số bài thi.
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .select('id, name, code, created_at, classroom_students(count), exam_rooms(count)')
      .eq('teacher_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const classrooms = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      createdAt: c.created_at,
      studentCount: c.classroom_students?.[0]?.count ?? 0,
      roomCount: c.exam_rooms?.[0]?.count ?? 0,
    }));

    return NextResponse.json({ classrooms });
  } catch (error) {
    console.error('List classrooms error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Tạo lớp mới.
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập tên lớp' }, { status: 400 });
    }

    const code = await uniqueClassroomCode();

    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .insert([{ name: String(name).trim(), code, teacher_id: session.user.id }])
      .select('id, name, code, created_at')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Không tạo được lớp' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: data.id,
        name: data.name,
        code: data.code,
        createdAt: data.created_at,
        studentCount: 0,
        roomCount: 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create classroom error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
