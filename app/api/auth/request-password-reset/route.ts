import { auth } from '@/auth.config';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const email = body?.email?.trim();

        if (!email) {
            return NextResponse.json({ error: { message: 'Email là bắt buộc.' } }, { status: 400 });
        }

        const result = await auth.api.requestPasswordReset({
            body: { email },
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: { message: error?.message || 'Không thể gửi yêu cầu khôi phục mật khẩu.' } },
            { status: 400 },
        );
    }
}
