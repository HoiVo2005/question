import { auth } from '@/auth.config';

export async function GET(request: Request) {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    // Trả về đúng shape mà better-auth client (useSession) mong đợi:
    // - Có phiên: { session: {...}, user: {...} }
    // - Không có phiên: null với mã 200 (giống handler mặc định của better-auth).
    if (!session) {
        return Response.json(null, { status: 200 });
    }

    return Response.json(session);
}
