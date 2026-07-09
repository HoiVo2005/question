import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';

// Xoá một mã đề trong ngân hàng đề.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;

    const { data: exam } = await supabaseAdmin
      .from('exam_sets')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!exam || exam.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await supabaseAdmin.from('exam_sets').delete().eq('id', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete exam set error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
