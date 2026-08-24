"use client";

import dynamic from "next/dynamic";

// On définit le dynamic import à l'intérieur d'un composant "use client"
const Map = dynamic(() => import("./MapComponent"), {
    ssr: false,
    loading: () => (
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
            Chargement de la carte...
        </div>
    ),
});

export default function MapWrapper() {
    return <Map />;
}
