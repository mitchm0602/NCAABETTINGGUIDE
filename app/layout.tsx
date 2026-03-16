import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NCAA Round 1 Model",
  description: "Live NCAA game model with SOR, SOS, current lines, projected spread, and projected total."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
