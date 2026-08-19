import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MOMENTUM — YouTube Shorts intelligence for India", template: "%s | MOMENTUM" },
  description: "Know what Indian YouTube Shorts are gaining momentum before everyone else does.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
