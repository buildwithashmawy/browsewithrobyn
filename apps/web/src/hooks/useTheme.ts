"use client";

import { useCallback, useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState("dark");

  // sync to whatever the pre-paint bootstrap script applied
  useEffect(() => {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(cur);
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("robyn-theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
