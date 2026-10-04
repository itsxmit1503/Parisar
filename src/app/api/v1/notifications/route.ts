import { NextRequest, NextResponse } from 'next/server';
import { loadSharedDbAsync, persistSharedDb } from '../../../../lib/serverStore';
import { ok, err, CORS_HEADERS, requireAuth } from '../../../../lib/apiMiddleware';
import { CampusNotification } from '../../../../types';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const db = await loadSharedDbAsync();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  const list = userId
    ? db.notifications.filter(n => n.userId === userId || n.userId === 'ALL')
    : db.notifications;

  return ok({ notifications: list, total: list.length });
}

export async function POST(req: NextRequest) {
  try {
    const db = await loadSharedDbAsync();
    const body = await req.json();
    const title = (body.title || '').trim();
    const message = (body.message || '').trim();
    const eventId = body.eventId;
    const targetAudience: 'ALL' | 'STUDENTS' | 'ORGANIZERS' = body.targetAudience || 'ALL';

    if (!title || !message) {
      return err('VALIDATION_ERROR', 'Notification title and message are required.', 400);
    }

    const nowIso = new Date().toISOString();
    let targetUserIds: string[] = [];

    if (eventId) {
      targetUserIds = db.registrations
        .filter(r => r.eventId === eventId && r.status === 'CONFIRMED')
        .map(r => r.userId);
    } else {
      targetUserIds = db.users
        .filter(u => {
          if (targetAudience === 'STUDENTS') return u.role === 'student';
          if (targetAudience === 'ORGANIZERS') return u.role === 'organizer';
          return true;
        })
        .map(u => u._id);
    }

    const created: CampusNotification[] = targetUserIds.map((uid, idx) => ({
      _id: `notif-${Date.now()}-${idx}`,
      userId: uid,
      eventId,
      type: 'ANNOUNCEMENT',
      title,
      message,
      read: false,
      createdAt: nowIso,
    }));

    db.notifications.unshift(...created);
    await persistSharedDb();

    return ok({ deliveredCount: created.length }, 201);
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Notification dispatch failed', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const db = await loadSharedDbAsync();
    const body = await req.json();
    const notificationId = body.notificationId || body._id;
    const markAll = Boolean(body.markAll);
    const userId = auth.authenticated ? auth.user.sub : body.userId;

    if (markAll && userId) {
      db.notifications = db.notifications.map(n =>
        n.userId === userId ? { ...n, read: true } : n
      );
    } else if (notificationId) {
      db.notifications = db.notifications.map(n =>
        n._id === notificationId ? { ...n, read: true } : n
      );
    }

    await persistSharedDb();
    return ok({ updated: true });
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Failed to update notification', 500);
  }
}
