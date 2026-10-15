import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { trickOrTreating } from '../../halloween/data/halloweenDetails';

/**
 * The preview map inside PinPlacerModal, lazy-loaded so Leaflet stays out of
 * the admin bundle until someone places a pin.
 *
 * A CircleMarker, like the public map (see TrickOrTreatMap for why), which
 * Leaflet cannot drag; clicking the map moves the pin instead.
 */

/** Zooms to `focus` when it changes, i.e. when a lookup match is chosen, not on every click. */
function FlyTo({ focus }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.setView([focus.lat, focus.lng], 18);
  }, [map, focus]);
  return null;
}

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function PinPlacerMap({ point, focus, kind, onPick }) {
  const { center, zoom } = trickOrTreating.mapDefaults;
  const style = trickOrTreating.mapKinds[kind] ?? trickOrTreating.mapKinds.residential;

  return (
    <MapContainer
      center={point ? [point.lat, point.lng] : center}
      zoom={point ? 18 : zoom}
      style={{ height: '100%', width: '100%', cursor: 'crosshair' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <FlyTo focus={focus} />
      <ClickToPlace onPick={onPick} />
      {point && (
        <CircleMarker
          center={[point.lat, point.lng]}
          radius={10}
          pathOptions={{ color: '#0e0c0c', weight: 2, fillColor: style.fill, fillOpacity: 0.95 }}
        />
      )}
    </MapContainer>
  );
}
