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

/**
 * Where an event's Volunteer button goes, or null. The shift board above wins;
 * otherwise `volunteer_signup_url` in data/event_overrides.json points at an
 * outside sign-up site (for the Light Up Senoia parade, volunteersignup.org).
 */
export const volunteerLink = (event) => {
  if (hasVolunteerBoard(event)) return { url: volunteerPath(event), external: false };
  const url = event?.volunteer_signup_url;
  return typeof url === 'string' && /^https?:\/\//i.test(url) ? { url, external: true } : null;
};
