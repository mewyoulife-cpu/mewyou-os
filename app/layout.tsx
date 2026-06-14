import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import BrandApplier from "@/components/BrandApplier";

export const metadata: Metadata = {
  title: "Mewyou Design OS",
  description: "ระบบจัดการงานออกแบบ Mewyou Studio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'IBM Plex Sans Thai', 'IBM Plex Sans', sans-serif", backgroundColor: '#eef1f4', margin: 0, padding: 0 }}>
        <BrandApplier />
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#eef1f4' }}>
          <Sidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Header />
            <main style={{ flex: 1, overflowY: 'auto', padding: '6px 28px 40px' }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
