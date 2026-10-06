import type { ReactNode } from "react";

import Navbar from "@/components/Navbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-6 py-12">{children}</main>
    </div>
  );
}
