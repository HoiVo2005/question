import { auth } from '@/auth.config';

export const POST = (req: any) => auth.handler(req);
export const GET = (req: any) => auth.handler(req);
