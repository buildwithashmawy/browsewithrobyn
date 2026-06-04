"use client";

import { useEffect, useState } from "react";
import type { ModelInfo } from "@/lib/types";
import { CURATED_MODELS } from "@/lib/curatedModels";

export function useModels() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/models")
      .then((r) => r.json())
      .then((d: { models?: ModelInfo[] }) => {
        if (!alive) return;
        setModels(d.models?.length ? d.models : CURATED_MODELS);
      })
      .catch(() => {
        if (alive) setModels(CURATED_MODELS);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { models, loading };
}
