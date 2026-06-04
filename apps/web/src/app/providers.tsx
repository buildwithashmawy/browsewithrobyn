"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useState, type ReactNode } from "react";

// Wraps the app in a Convex client built from NEXT_PUBLIC_CONVEX_URL.
// If the URL is absent (e.g. the fixtures /preview route with no backend),
// children render without Convex — only pages that call Convex hooks need it.
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    return url ? new ConvexReactClient(url) : null;
  });

  if (!client) return <>{children}</>;
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
