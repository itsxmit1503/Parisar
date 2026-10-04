import { NextRequest, NextResponse } from 'next/server';
import { loadSharedDbAsync } from '../../../../lib/serverStore';
import { ok, CORS_HEADERS } from '../../../../lib/apiMiddleware';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/v1/audit
 * Returns persistent university audit logs (filterable by action, role, or actor).
 */
export async function GET(req: NextRequest) {
  const db = await loadSharedDbAsync();
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const role = searchParams.get('role');

  let logs = [...db.auditLogs];
  if (action) logs = logs.filter(l => l.action === action);
  if (role) logs = logs.filter(l => l.role === role);

  return ok({ auditLogs: logs, total: logs.length });
}
