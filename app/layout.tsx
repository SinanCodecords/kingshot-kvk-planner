import type { Metadata, Viewport } from "next";
import TopBar from "@/components/TopBar";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "KvK Appointments",
  description: "Sign up for the King's appointment during KvK.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <TopBar />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
