import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/firebase/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
    title: "Trails Register",
    description: "Trails Register",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="fr" className={cn("h-full antialiased", "font-sans", inter.variable)} suppressHydrationWarning>
            <body className="min-h-full flex flex-col">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>{children}</AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
