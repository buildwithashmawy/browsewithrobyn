"use client";

import { Icon } from "./Icon";

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: string;
  onToggle: () => void;
}) {
  return (
    <button
      className="icon-btn"
      onClick={onToggle}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
    </button>
  );
}
