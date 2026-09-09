import { NextRequest, NextResponse } from 'next/server';

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function withPublic<T>(
  handler: (req: NextRequest, ctx: { params: T }) => Promise<NextResponse>,
) {
  return async (req: NextRequest, ctx: { params: T }) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return NextResponse.json(
        { message: error instanceof Error ? error.message : 'Error del servidor' },
        { status: 500 },
      );
    }
  };
}