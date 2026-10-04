import { NextRequest, NextResponse } from 'next/server';
import {
  loadSharedDbAsync,
  persistSharedDb,
  recordAuditLog,
} from '../../../../lib/serverStore';
import { ok, err, CORS_HEADERS, requireAdmin } from '../../../../lib/apiMiddleware';
import { CampusVenue } from '../../../../types';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/v1/venues
 * Returns all verified DHSGSU campus venues and locations.
 */
export async function GET() {
  const db = await loadSharedDbAsync();
  return ok({ venues: db.venues, total: db.venues.length });
}

/**
 * POST /api/v1/venues
 * Admin adds a new campus venue.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req);
    const db = await loadSharedDbAsync();
    const body = await req.json();

    const name = (body.name || '').trim();
    if (!name) {
      return err('VALIDATION_ERROR', 'Venue name is required.', 400);
    }

    const newVenue: CampusVenue = {
      id: body.id || `venue-${Date.now()}`,
      name,
      secondaryName: body.secondaryName || '',
      plusCode: body.plusCode || '',
      category: body.category || 'Event Venue',
      latitude: body.latitude !== undefined && body.latitude !== null ? Number(body.latitude) : null,
      longitude: body.longitude !== undefined && body.longitude !== null ? Number(body.longitude) : null,
      description: body.description || `Official campus venue at Dr. Harisingh Gour Vishwavidyalaya.`,
      address: body.address || 'Dr. Harisingh Gour Vishwavidyalaya, Patharia Hills, Sagar, MP 470003',
      verified: body.verified || 'verified',
      source: body.source || 'DHSGSU University Administration Registry',
      navigationQuery: `${name}, Dr. Harisingh Gour Vishwavidyalaya, Sagar`,
      isEventVenue: body.isEventVenue !== false,
      building: body.building || name,
      capacity: Number(body.capacity) || 150,
      features: Array.isArray(body.features) ? body.features : ['Projector', 'PA System', 'Wi-Fi'],
    };

    db.venues.unshift(newVenue);

    recordAuditLog({
      actor: auth.authorized ? auth.user.sub : 'admin-1',
      role: 'admin',
      action: 'VENUE_UPDATED',
      entity: 'CampusVenue',
      entityId: newVenue.id,
      metadata: { action: 'CREATE', name: newVenue.name, capacity: newVenue.capacity },
    });

    await persistSharedDb();
    return ok({ venue: newVenue, venues: db.venues }, 201);
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Failed to create venue', 500);
  }
}

/**
 * PATCH /api/v1/venues
 * Admin edits an existing campus venue (capacity, coordinates, amenities, verification, active status).
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = requireAdmin(req);
    const db = await loadSharedDbAsync();
    const body = await req.json();
    const venueId = body.id || body.venueId;

    const idx = db.venues.findIndex(v => v.id === venueId);
    if (idx === -1) {
      return err('VENUE_NOT_FOUND', 'Venue not found.', 404);
    }

    const updated: CampusVenue = {
      ...db.venues[idx],
      ...body,
      id: db.venues[idx].id,
    };
    db.venues[idx] = updated;

    recordAuditLog({
      actor: auth.authorized ? auth.user.sub : 'admin-1',
      role: 'admin',
      action: 'VENUE_UPDATED',
      entity: 'CampusVenue',
      entityId: updated.id,
      metadata: { action: 'UPDATE', name: updated.name, verified: updated.verified },
    });

    await persistSharedDb();
    return ok({ venue: updated, venues: db.venues });
  } catch (e) {
    return err('SERVER_ERROR', e instanceof Error ? e.message : 'Failed to update venue', 500);
  }
}
