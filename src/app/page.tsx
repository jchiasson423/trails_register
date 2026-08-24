import MapWrapper from "@/components/map/MapWrapper";

export default function HomePage() {
    return (
        <main className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
            {/* Barre de menu en haut (fixée à une hauteur de 16 / 4rem) */}
            <header className="h-16 border-b flex items-center px-6 justify-between shrink-0 z-10 bg-card">
                <div className="font-bold text-lg tracking-tight">
                    Gestion des Sentiers
                </div>

                {/* Espace de menu (vide pour l'instant, tu pourras y ajouter ton ModeToggle ou ton profil) */}
                <div className="flex items-center gap-4">
                    {/* Exemple : <ModeToggle /> */}
                </div>
            </header>

            {/* Zone de la carte : prend tout l'espace restant de l'écran */}
            <div className="flex-1 w-full relative">
                <MapWrapper />
            </div>
        </main>
    );
}
