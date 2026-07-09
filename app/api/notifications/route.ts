import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createNotification } from '@/lib/notify-server';

// Danh sách thông báo của người dùng + số chưa đọc.
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabaseAdmin
      .from('notifications')
      .select('id, title, body, type, link, is_read, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const items = data || [];
    const unread = items.filter((n: any) => !n.is_read).length;
    return NextResponse.json({ notifications: items, unread });
  } catch (error) {
    console.error('List notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Tự tạo thông báo cho chính mình (vd: đổi thông tin/mật khẩu).
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, body, type } = await request.json();
    if (!title) {
      return NextResponse.json({ error: 'Thiếu tiêu đề' }, { status: 400 });
    }
    await createNotification(session.user.id, { title, body, type });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
