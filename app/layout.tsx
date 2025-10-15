import type { Metadata } from "next";
import "./globals.css";
import { JsReady } from "@/components/JsReady";

export const metadata: Metadata = {
  title: "luke white",
  description:
    "the home of artism",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <JsReady />
        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}
