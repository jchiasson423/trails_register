"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface LocationContextType {
    latitude: number | null;
    longitude: number | null;
    loading: boolean;
    error: string | null;
}

const LocationContext = createContext<LocationContextType | null>(null);

const UNSUPPORTED_GEOLOCATION_ERROR =
    "La géolocalisation n'est pas supportée par votre navigateur.";

export function LocationProvider({ children }: { children: React.ReactNode }) {
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const applyResult = (
            next: Partial<
                Pick<LocationContextType, "latitude" | "longitude" | "error">
            >,
        ) => {
            if (cancelled) return;
            if (next.latitude !== undefined) setLatitude(next.latitude);
            if (next.longitude !== undefined) setLongitude(next.longitude);
            if (next.error !== undefined) setError(next.error);
            setLoading(false);
        };

        if (!navigator.geolocation) {
            const id = window.setTimeout(() => {
                applyResult({ error: UNSUPPORTED_GEOLOCATION_ERROR });
            }, 0);
            return () => {
                cancelled = true;
                window.clearTimeout(id);
            };
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                applyResult({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    error: null,
                });
            },
            (err) => {
                applyResult({ error: err.message });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <LocationContext.Provider
            value={{ latitude, longitude, loading, error }}
        >
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
}
