import React, { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const sharedMapIcon = L.icon({
    iconUrl: '/images/mapicon.png',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -24]
});

const MapInteractionController = ({ bounds }) => {
    const map = useMap();

    useEffect(() => {
        map.scrollWheelZoom.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.dragging.enable();
        map.boxZoom.enable();
        map.keyboard.enable();

        if (map.tap) {
            map.tap.enable();
        }

        map.fitBounds(bounds, {
            padding: [24, 24]
        });
    }, [bounds, map]);

    return null;
};

const SummaryLeafletMap = ({
    locations,
    activeName,
    onSelect,
    bounds
}) => {
    return (
        <div className="leaflet-map-shell">
            <MapContainer
                className="network-leaflet-map"
                bounds={bounds}
                scrollWheelZoom={true}
                touchZoom={true}
                doubleClickZoom={true}
                dragging={true}
                zoomControl={true}
                attributionControl={true}
                zoomSnap={0.25}
                zoomDelta={0.5}
                wheelPxPerZoomLevel={180}
                minZoom={3}
                maxZoom={7}
            >
                <MapInteractionController bounds={bounds} />

                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {locations.map((location) => {
                    const topUser = location.data.activeUsers?.[0];

                    return (
                        <Marker
                            key={location.key}
                            position={location.center}
                            icon={sharedMapIcon}
                            eventHandlers={{
                                click: (event) => {
                                    onSelect(location.data.stateName);
                                    event.target.openPopup();
                                },
                                mouseover: (event) => event.target.openPopup(),
                                mouseout: (event) => event.target.closePopup()
                            }}
                        >
                            <Popup className="network-map-popup" autoPan={true}>
                                <div className="leaflet-popup-card">
                                    <div className="leaflet-popup-title">{location.data.stateName}</div>
                                    <div className="leaflet-popup-stat">
                                        {location.data.videoCount} Videos
                                    </div>
                                    <div className="leaflet-popup-stat">
                                        {location.data.influencerCount} Active
                                    </div>
                                    {topUser && (
                                        <div className="leaflet-popup-user">
                                            Top: {topUser.name} ({topUser.posts})
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default SummaryLeafletMap;
