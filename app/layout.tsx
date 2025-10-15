import type { Metadata } from "next";
import "./globals.css";
import { JsReady } from "@/components/JsReady";

// Metadata for the site
export const metadata: Metadata = {
  title: "luke white",
  description:
    "the home of artism",
};

// Root layout component
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <JsReady /> {/* Ensures JS is loaded */}
        <main className="page-shell">{children}</main> {/* Main content area */}
      </body>
    </html>
  );
}
