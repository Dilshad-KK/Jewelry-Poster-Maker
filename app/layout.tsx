import type { ReactNode } from "react";
import "@/styles/globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#1b1b1b] antialiased">{children}</body>
    </html>
  );
}

