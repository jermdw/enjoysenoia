import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { trickOrTreating } from '../data/halloweenDetails';

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
