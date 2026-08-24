"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation } from "../location/LocationProvider";

export default function Map() {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const { latitude, longitude, loading } = useLocation();

    useEffect(() => {
        if (!mapRef.current) return;

        // Si la carte n'est pas encore initialisée
        if (!mapInstanceRef.current) {
            // Position par défaut (ex: Victoriaville si la géolocalisation charge ou échoue)
            const defaultLat = latitude ?? 46.0667;
            const defaultLng = longitude ?? -71.9667;

            const map = L.map(mapRef.current).setView(
                [defaultLat, defaultLng],
                13,
            );

            // C'EST ICI QU'ON UTILISE LES TUILES OPENSTREETMAP !
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);

            mapInstanceRef.current = map;
        } else if (latitude && longitude && mapInstanceRef.current) {
            // Si la position change ou vient d'arriver, on déplace la carte dessus
            mapInstanceRef.current.setView([latitude, longitude], 14);
            L.marker([latitude, longitude])
                .addTo(mapInstanceRef.current)
                .bindPopup("Vous êtes ici !")
                .openPopup();
        }

        // Nettoyage lors du démontage du composant
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [latitude, longitude]);

    return (
        <div className="relative w-full h-[calc(100vh-4rem)]">
            {loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                    <p className="text-sm font-medium">
                        Recherche de votre position...
                    </p>
                </div>
            )}
            {/* Conteneur de la carte */}
            <div ref={mapRef} className="w-full h-full z-0" />
        </div>
    );
}
