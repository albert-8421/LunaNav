import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
export const metadata: Metadata = { title: "LUNA NAV | A Guide to Lunar Sunlight and Earth Visibility", description: "Explore how sunlight and a view of Earth change across reference places near the Moon’s south pole." };
export default function RootLayout({children}:{children:ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
