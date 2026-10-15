/**
 * Whether an event has a volunteer shift board linked to it.
 *
 * Staff switch it per event in the admin portal (`volunteer_enabled` on the
 * event's Firestore patch). An event that carries `volunteer_url` in
 * data/event_overrides.json is linked by default, and staff can still unlink
 * it. The board itself lives at /volunteer/<slug>.
 */
export const hasVolunteerBoard = (event) =>
  typeof event?.volunteer_enabled === 'boolean' ? event.volunteer_enabled : Boolean(event?.volunteer_url);

export const volunteerPath = (event) => `/volunteer/${event.slug}`;
