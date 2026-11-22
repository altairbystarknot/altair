"use client";

import { useState } from "react";
import { Icon } from "@altair/ui";

/** Copies a text to the clipboard and says so for two seconds. */
export function CopyButton({ text, label, primary = false }: { text: string; label: string; primary?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`btn ${primary ? "tint" : "line"} sm`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      <Icon name={done ? "check" : "clipboard"} size={15} /> {done ? "Copiado" : label}
    </button>
  );
}
