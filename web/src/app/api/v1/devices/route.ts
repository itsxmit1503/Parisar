import { NextRequest, NextResponse } from 'next/server';
import {
  loadSharedDbAsync,
  persistSharedDb,
  recordAuditLog,
  sanitizeUser,
} from '../../../../lib/serverStore';
import { ok, err, CORS_HEADERS, requireAuth } from '../../../../lib/apiMiddleware';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/v1/devices
 * Returns registered devices for the authenticated user (or specified userId).
 */
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const db = await loadSharedDbAsync();
  const { searchParams } = new URL(req.url);
  const userId = auth.authenticated ? auth.user.sub : searchParams.get('userId');

  const user = db.users.find(u => u._id === userId);
  if (!user) {
    return err('USER_NOT_FOUND', 'Account not found.', 404);
  }

  return ok({ devices: user.registeredDevices || [], maxPerPlatform: 1 });
}

/**
 * POST /api/v1/devices
 * Verifies or replaces the 1 Web or 1 Mobile device slot for a user account on the server.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const db = await loadSharedDbAsync();
    const body = await req.json();

    const userId = auth.authenticated ? auth.user.sub : body.userId;
    const deviceId = (body.deviceId || '').trim();
    const platform: 'web' | 'mobile' = body.platform === 'mobile' ? 'mobile' : 'web';
    const deviceName =
      (body.deviceName || '').trim() ||
      (platform === 'mobile' ? 'PARISAR Android Client' : 'PARISAR Web Browser');

    if (!userId || !deviceId) {
      return err('VALIDATION_ERROR', 'User ID and Device ID are required.', 400);
    }

    const userIdx = db.users.findIndex(u => u._id === userId);
    if (userIdx === -1) {
      return err('USER_NOT_FOUND', 'User account not found.', 404);
    }

    const nowIso = new Date().toISOString();
    const user = db.users[userIdx];
    const currentDevices = Array.isArray(user.registeredDevices) ? [...user.registeredDevices] : [];
    const filtered = currentDevices.filter(d => d.platform !== platform);

    filtered.push({
      deviceId,
      platform,
      deviceName,
      verifiedAt: nowIso,
      lastActiveAt: nowIso,
    });

    user.registeredDevices = filtered;
    user.updatedAt = nowIso;

    recordAuditLog({
      actor: user._id,
      actorName: user.name,
      role: user.role,
      action: 'DEVICE_REGISTERED',
      entity: 'RegisteredDevice',
      entityId: deviceId,
      metadata: { platform, deviceName },
    });

    await persistSharedDb();
    return ok({ user: sanitizeUser(user), devices: user.registeredDevices });
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Device verification failed', 500);
  }
}

/**
 * DELETE /api/v1/devices
 * Revokes a registered device slot.
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const db = await loadSharedDbAsync();
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');
    const userId = auth.authenticated ? auth.user.sub : searchParams.get('userId');

    if (!userId || !deviceId) {
      return err('VALIDATION_ERROR', 'User ID and Device ID are required.', 400);
    }

    const userIdx = db.users.findIndex(u => u._id === userId);
    if (userIdx === -1) {
      return err('USER_NOT_FOUND', 'User not found.', 404);
    }

    const user = db.users[userIdx];
    user.registeredDevices = (user.registeredDevices || []).filter(d => d.deviceId !== deviceId);
    user.updatedAt = new Date().toISOString();

    recordAuditLog({
      actor: user._id,
      actorName: user.name,
      role: user.role,
      action: 'DEVICE_REVOKED',
      entity: 'RegisteredDevice',
      entityId: deviceId,
    });

    await persistSharedDb();
    return ok({ user: sanitizeUser(user), devices: user.registeredDevices });
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Device revocation failed', 500);
  }
}
