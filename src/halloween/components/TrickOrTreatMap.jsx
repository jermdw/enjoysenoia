import React from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, CircleMarker, Marker, Polygon, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { trickOrTreating } from '../data/halloweenDetails';
import { BAT_PATH, BAT_VIEWBOX } from './Art';

// Trick-or-treat zones are bats, not dots. A divIcon holding inline SVG needs
// no image file, so it avoids the bundler problem CircleMarker is used for
// below. The cream outline keeps the black bat readable on dark roads.
const batIcon = L.divIcon({
  className: 'hallo-bat-marker',
  html: `<svg viewBox="${BAT_VIEWBOX}" width="48" height="20" aria-hidden="true" focusable="false">`
    + `<path d="${BAT_PATH}" fill="#0e0c0c" stroke="#fff7ea" stroke-width="5" stroke-linejoin="round" paint-order="stroke"/>`
    + '<circle cx="47" cy="44" r="1.8" fill="#fff7ea"/><circle cx="53" cy="44" r="1.8" fill="#fff7ea"/>'
    + '</svg>',
  iconSize: [48, 20],
  iconAnchor: [24, 10],
  popupAnchor: [0, -8],
});

/**
 * The map itself, lazy-loaded by TrickOrTreating so Leaflet stays out of the
 * initial bundle.
 *
 * CircleMarker rather than Marker on purpose: Leaflet's default marker points
 * at image files that bundlers rewrite, which is the classic "markers don't
 * render in production" bug. A vector circle needs no assets and takes the
 * theme colour directly.
 *
 * OpenStreetMap tiles need no API key and no billing account — the site can go
 * live without anyone provisioning a maps product. Note OSM's tile usage policy
 * if traffic ever gets heavy.
 */
export default function TrickOrTreatMap({ points }) {
  const { center, zoom } = trickOrTreating.mapDefaults;
  const kinds = trickOrTreating.mapKinds;

  // A point with no coordinates has not been placed by an admin yet. Skipping
  // it here is what lets the site run without a geocoding service.
  const placed = points.filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number');

  return (
    <div className="hallo-map">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Drawn first so the pins sit on top of the shading. */}
        {trickOrTreating.mapAreas.map((area) => (
          <Polygon
            key={area.id}
            positions={area.polygon}
            pathOptions={{ color: area.stroke, weight: 2, dashArray: '6 4', fillColor: area.fill, fillOpacity: 0.3 }}
          >
            <Tooltip sticky>{area.label}</Tooltip>
          </Polygon>
        ))}
        {trickOrTreating.trickOrTreatZones.spots.map((spot) => (
          <Marker key={spot.name} position={spot.at} icon={batIcon}>
            <Popup>
              <strong>{trickOrTreating.trickOrTreatZones.label}</strong>
              <br />
              {spot.name}
            </Popup>
          </Marker>
        ))}
        {placed.map((point) => {
          const style = kinds[point.kind] ?? kinds.residential;
          return (
            <CircleMarker
              key={point.id}
              center={[point.lat, point.lng]}
              radius={9}
              pathOptions={{ color: '#0e0c0c', weight: 2, fillColor: style.fill, fillOpacity: 0.95 }}
            >
              <Popup>
                <strong>{point.label || style.label}</strong>
                <br />
                {point.address}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
