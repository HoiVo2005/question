import { NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { headers } from 'next/headers';
import { getActiveSubscription, isAdminUser } from '@/lib/billing';

// Gói đang áp dụng của người dùng hiện tại (đã xét hết hạn).
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const sub = await getActiveSubscription(session.user.id);
    return NextResponse.json({
      ...sub,
      role: (session.user as any).role || 'student',
      isAdmin: isAdminUser(session.user),
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
