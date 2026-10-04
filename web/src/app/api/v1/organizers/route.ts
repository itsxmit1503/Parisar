import { NextRequest, NextResponse } from 'next/server';
import {
  loadSharedDbAsync,
  persistSharedDb,
  recordAuditLog,
  sanitizeUser,
} from '../../../../lib/serverStore';
import { ok, err, CORS_HEADERS, requireAuth, requireAdmin } from '../../../../lib/apiMiddleware';
import { OrganizerVerificationRequest } from '../../../../types';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const db = await loadSharedDbAsync();
  return ok({ requests: db.organizerRequests, total: db.organizerRequests.length });
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const db = await loadSharedDbAsync();
    const body = await req.json();

    const userId = auth.authenticated ? auth.user.sub : body.userId;
    const user = db.users.find(u => u._id === userId);
    if (!user) {
      return err('USER_NOT_FOUND', 'Applicant user account not found.', 404);
    }

    const nowIso = new Date().toISOString();
    const newReq: OrganizerVerificationRequest = {
      id: `req-${Date.now()}`,
      userId: user._id,
      fullName: body.fullName || user.name,
      universityId: body.universityId || user.rollNumber || 'EMP-DHSGSU',
      department: body.department || user.department,
      designation: body.designation || user.designation || 'Faculty / Society Convener',
      email: user.email,
      phone: body.phone || user.phone || '+91 98260 00000',
      reason: (body.reason || '').trim(),
      status: 'PENDING',
      submittedAt: nowIso,
    };

    user.role = 'organizer';
    user.organizerStatus = 'PENDING';
    user.organizerRequest = newReq;
    user.updatedAt = nowIso;

    db.organizerRequests.unshift(newReq);

    recordAuditLog({
      actor: user._id,
      actorName: user.name,
      role: 'organizer',
      action: 'ORGANIZER_REQUEST',
      entity: 'OrganizerVerificationRequest',
      entityId: newReq.id,
      metadata: { department: newReq.department, designation: newReq.designation },
    });

    await persistSharedDb();
    return ok({ request: newReq, user: sanitizeUser(user) }, 201);
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Failed to submit organizer request', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireAdmin(req);
    const db = await loadSharedDbAsync();
    const body = await req.json();
    const { requestId, approve, remarks } = body;

    const reqItem = db.organizerRequests.find(r => r.id === requestId);
    if (!reqItem) {
      return err('NOT_FOUND', 'Verification request not found.', 404);
    }

    const nowIso = new Date().toISOString();
    reqItem.status = approve ? 'APPROVED' : 'REJECTED';
    reqItem.reviewedAt = nowIso;
    reqItem.reviewRemarks =
      remarks ||
      (approve
        ? 'Approved by Office of the Dean of Students Welfare (DSW)'
        : 'Rejected by University Administration');

    db.users = db.users.map(u => {
      if (u._id === reqItem.userId || u.email.toLowerCase() === reqItem.email.toLowerCase()) {
        return {
          ...u,
          role: 'organizer',
          organizerStatus: approve ? 'VERIFIED' : 'REJECTED',
          updatedAt: nowIso,
        };
      }
      return u;
    });

    recordAuditLog({
      actor: auth.authorized ? auth.user.sub : 'admin-1',
      role: 'admin',
      action: approve ? 'ORGANIZER_APPROVED' : 'ORGANIZER_REJECTED',
      entity: 'OrganizerVerificationRequest',
      entityId: reqItem.id,
      metadata: { applicant: reqItem.fullName, remarks: reqItem.reviewRemarks },
    });

    await persistSharedDb();
    return ok({ request: reqItem, organizerRequests: db.organizerRequests });
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Failed to review request', 500);
  }
}
