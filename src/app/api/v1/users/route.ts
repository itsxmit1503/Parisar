import { NextRequest, NextResponse } from 'next/server';
import {
  loadSharedDbAsync,
  persistSharedDb,
  recordAuditLog,
  hashPassword,
  sanitizeUser,
} from '../../../../lib/serverStore';
import { ok, err, CORS_HEADERS, requireAuth } from '../../../../lib/apiMiddleware';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const ALLOWED_IMAGE_MIME_PREFIXES = [
  'data:image/jpeg;base64,',
  'data:image/jpg;base64,',
  'data:image/png;base64,',
  'data:image/webp;base64,',
];
const MAX_BASE64_LENGTH = 3_500_000; // ~2.5MB binary image

export async function GET(req: NextRequest) {
  const db = await loadSharedDbAsync();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (userId) {
    const user = db.users.find(u => u._id === userId);
    if (!user) return err('USER_NOT_FOUND', 'User not found.', 404);
    return ok({ user: sanitizeUser(user) });
  }

  return ok({ users: db.users.map(sanitizeUser), total: db.users.length });
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    const db = await loadSharedDbAsync();
    const body = await req.json();

    const targetId = body.userId || (auth.authenticated ? auth.user.sub : '');
    const userIdx = db.users.findIndex(u => u._id === targetId);
    if (userIdx === -1) {
      return err('USER_NOT_FOUND', 'Target user not found.', 404);
    }

    const existing = db.users[userIdx];
    const nowIso = new Date().toISOString();

    // Only admin can change roles
    if (body.role && body.role !== existing.role) {
      if (auth.authenticated && auth.user.role !== 'admin') {
        return err('FORBIDDEN', 'Only University Administrators can modify account roles.', 403);
      }
      recordAuditLog({
        actor: auth.authenticated ? auth.user.sub : 'admin-1',
        role: 'admin',
        action: 'ADMIN_ROLE_CHANGE',
        entity: 'User',
        entityId: existing._id,
        metadata: { oldRole: existing.role, newRole: body.role },
      });
    }

    // Validate profileImage if provided
    let nextProfileImage = existing.profileImage;
    if (body.profileImage !== undefined) {
      const rawImg = String(body.profileImage || '').trim();
      if (rawImg === '') {
        nextProfileImage = '';
      } else {
        const isSafeMime = ALLOWED_IMAGE_MIME_PREFIXES.some(prefix =>
          rawImg.toLowerCase().startsWith(prefix)
        );
        if (!isSafeMime) {
          return err(
            'INVALID_IMAGE_TYPE',
            'Invalid file type. Only JPEG, PNG, and WebP images are permitted.',
            400
          );
        }
        if (rawImg.length > MAX_BASE64_LENGTH) {
          return err(
            'IMAGE_TOO_LARGE',
            'Profile photo exceeds the 2.5 MB maximum size limit.',
            400
          );
        }
        nextProfileImage = rawImg;
      }
    }

    const updatedPasswordHash =
      body.password || body.passwordHash
        ? hashPassword(String(body.password || body.passwordHash))
        : existing.passwordHash;

    // University-controlled fields (rollNumber, department, semester) are locked for normal students unless Admin edits
    const isAdminActor = auth.authenticated && auth.user.role === 'admin';

    const updated = {
      ...existing,
      name: body.name !== undefined ? String(body.name).trim() : existing.name,
      department: isAdminActor && body.department ? body.department : existing.department,
      semester: isAdminActor && body.semester ? Number(body.semester) : existing.semester,
      designation: body.designation ?? existing.designation,
      organization: body.organization ?? existing.organization,
      phone: body.phone !== undefined ? String(body.phone).trim() : existing.phone,
      bio: body.bio !== undefined ? String(body.bio).trim() : existing.bio,
      preferredLanguage: body.preferredLanguage ?? existing.preferredLanguage,
      notificationPreferences:
        body.notificationPreferences ?? existing.notificationPreferences,
      privacyPreferences: body.privacyPreferences ?? existing.privacyPreferences,
      profileImage: nextProfileImage,
      interests: Array.isArray(body.interests) ? body.interests : existing.interests,
      role: body.role ?? existing.role,
      organizerStatus:
        body.role === 'organizer'
          ? 'VERIFIED'
          : body.role === 'student'
          ? 'NONE'
          : existing.organizerStatus,
      passwordHash: updatedPasswordHash,
      updatedAt: nowIso,
    };

    db.users[userIdx] = updated;

    recordAuditLog({
      actor: existing._id,
      actorName: updated.name,
      role: updated.role,
      action: 'PROFILE_UPDATED',
      entity: 'User',
      entityId: existing._id,
      metadata: {
        photoChanged: body.profileImage !== undefined,
        photoRemoved: body.profileImage === '',
      },
    });

    await persistSharedDb();

    return ok({ user: sanitizeUser(updated) });
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Failed to update profile', 500);
  }
}
