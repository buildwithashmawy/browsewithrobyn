"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/api";

export interface SessionSummary {
  _id: string;
  prompt: string;
  status: string;
  createdAt: number;
}

export function useSessionsList(): SessionSummary[] {
  const rows = useQuery(api.sessions.list, {});
  return (rows ?? []) as SessionSummary[];
}
