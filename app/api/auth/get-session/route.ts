import { auth } from '@/auth.config';

export async function GET(request: Request) {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session) {
        return Response.json({ session: null }, { status: 401 });
    }

    return Response.json({ session });
}
