import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/client';
import { isAdminUser } from '@/lib/billing';
import { createNotification } from '@/lib/notify-server';

const ROLES = ['student', 'teacher', 'admin'];

// Đổi vai trò người dùng.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !isAdminUser(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { role } = (await request.json()) as { role: string };
    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: 'Vai trò không hợp lệ' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      return NextResponse.json({ error: 'Không cập nhật được' }, { status: 500 });
    }

    await createNotification(id, {
      title: 'Vai trò tài khoản thay đổi',
      body: `Quản trị viên đã đặt vai trò của bạn thành "${role}".`,
      type: 'account',
    });

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Xoá người dùng (kèm toàn bộ dữ liệu liên quan qua khoá ngoại ON DELETE CASCADE).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !isAdminUser(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Không thể tự xoá tài khoản admin đang đăng nhập' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from('users').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: 'Không xoá được người dùng' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
