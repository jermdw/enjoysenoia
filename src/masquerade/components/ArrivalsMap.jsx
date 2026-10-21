import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { arrivals } from '../data/eventDetails';

// CircleMarker, not Marker: Leaflet's default pin is an image file the bundler
// rewrites, so it goes missing in production (see TrickOrTreatMap).
const styles = {
  venue: { radius: 11, fillColor: '#b51823' },
  parking: { radius: 8, fillColor: '#c2a36b' },
  golf: { radius: 8, fillColor: '#f2e7d5' },
};

/** Lazy-loaded by ArrivalsParking. Labels are permanent tooltips so they read without a tap. */
export default function ArrivalsMap() {
  // Picked once at mount; a resize after load keeps whatever zoom it started with.
  const narrow = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div className="masq-map">
      <MapContainer
        center={arrivals.center}
        zoom={narrow ? arrivals.zoomNarrow : arrivals.zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {arrivals.markers.map((m) => {
          const style = styles[m.kind];
          return (
            <CircleMarker
              key={m.id}
              center={m.at}
              radius={style.radius}
              pathOptions={{ color: '#0b0a0c', weight: 2, fillColor: style.fillColor, fillOpacity: 1 }}
            >
              <Tooltip
                permanent
                direction={m.tooltip}
                offset={{ top: [0, -10], bottom: [0, 10], left: [-10, 0], right: [10, 0] }[m.tooltip]}
                className={`masq-map-label masq-map-label-${m.kind}`}
              >
                {m.label}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
