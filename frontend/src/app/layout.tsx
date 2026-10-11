import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StructuraLens | Civil AI Diagnostics",
  description: "Autonomous Edge-to-Cloud Infrastructure Diagnostics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#07090e] text-neutral-200 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
