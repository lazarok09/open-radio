import "./globals.css";
import { Providers } from "@/components/providers";
export const metadata = { title: "Open Radio", description: "A live, listener-built radio queue" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Providers>{children}</Providers></body></html>; }
