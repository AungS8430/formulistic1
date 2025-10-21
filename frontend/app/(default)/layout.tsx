import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar"
import Navbar from "@/components/navbar";
import AppSidebar from "@/components/sidebar";
import "../globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: "400"
});

export const metadata: Metadata = {
  title: "Formulistic1",
  description: "Realtime and past F1 race data",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${spaceMono.variable} antialiased min-h-dvh flex flex-col`}
      >
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <SidebarProvider className="flex flex-col">
          <AppSidebar />
          <Navbar />
          <div className="mx-auto p-4 sm:px-4 grow flex">
            {children}
          </div>
        </SidebarProvider>

      </ThemeProvider>
      </body>
      </html>
    </>
  );
}