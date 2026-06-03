interface Entry {
  key: string; // hash|kind|target
  kind: string;
  target: string;
  ok: boolean;
  note?: string;
}

// Running memory of what's been tried, so the agent never loops on the same
// failing action and the planner can see its own history.
export class Scratchpad {
  private entries: Entry[] = [];

  push(e: Entry) {
    this.entries.push(e);
  }

  // true if this exact (page + action + target) has already been attempted before
  looping(key: string): boolean {
    return this.entries.filter((e) => e.key === key).length >= 1;
  }

  toText(n = 8): string {
    return this.entries
      .slice(-n)
      .map(
        (e, i) =>
          `${i + 1}. [${e.ok ? "ok" : "retry"}] ${e.kind} → ${e.target}${e.note ? ` (${e.note})` : ""}`,
      )
      .join("\n");
  }
}

export function hashObservation(url: string, aria: string): string {
  const s = url + "\n" + aria.slice(0, 2000);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return String(h >>> 0);
}
