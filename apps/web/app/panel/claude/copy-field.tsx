"use client";

import { useState } from "react";
import { Icon } from "@altair/ui";

export function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="field">
      <span className="lbl">{label}</span>
      <div className="input" style={{ paddingRight: 6 }}>
        <Icon name="link" size={18} />
        <input readOnly value={value} className="mono" onFocus={(e) => e.currentTarget.select()} aria-label={label} />
        <button
          type="button"
          className="btn tint sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? <Icon name="check" size={16} /> : null}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
