"use client"; // Indispensable pour voir les logs dans le navigateur Chrome

import { useEffect } from "react";
// ⚡️ C'est cette ligne qui va forcer l'exécution de ton fichier firebase_service.ts !
import { auth } from "@/services/firebase_service";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Juste pour confirmer que l'objet auth est bien disponible
        console.log("AuthProvider est prêt. Instance Auth :", auth.name);
    }, []);

    return <>{children}</>;
}
