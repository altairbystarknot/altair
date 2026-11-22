import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";
import { Icon, type IconName } from "./Icon";

// Thin React wrappers over the classes in styles.css. They add semantics and accessible defaults; the look
// lives in CSS so the canvas and the app cannot drift. Apple HIG rule kept from the canvas: glass is for
// controls, navigation and floating panels; content sits on solid cards.

/* ---------------- buttons ---------------- */

export type ButtonVariant = "tint" | "line" | "ghost" | "gold" | "glass";
export type ButtonSize = "sm" | "md" | "lg";

/** Class string for anything that should look like a button (use it on <Link> too). */
export function buttonClass(variant: ButtonVariant = "tint", size: ButtonSize = "md", block = false): string {
  return cx("btn", variant === "glass" ? "glass flat" : variant, size !== "md" && size, block && "block");
}

export function Button({
  variant = "tint",
  size = "md",
  block = false,
  className,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; block?: boolean }) {
  return <button type={type} className={cx(buttonClass(variant, size, block), className)} {...rest} />;
}

/* ---------------- surfaces ---------------- */

export function Glass({
  variant = "regular",
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { variant?: "regular" | "flat" | "clear" | "dark" }) {
  return <div className={cx("glass", variant !== "regular" && variant, className)} {...rest} />;
}

export function Card({ pad = "md", className, ...rest }: HTMLAttributes<HTMLDivElement> & { pad?: "none" | "md" | "lg" }) {
  return <div className={cx("card", pad === "md" && "pad", pad === "lg" && "pad-l", className)} {...rest} />;
}

export function Panel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("panel", className)} {...rest} />;
}

/* ---------------- status ---------------- */

export type Tone = "ok" | "warn" | "bad" | "info" | "gold" | "mute";

export function StatusPill({ tone = "info", className, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={cx("st", tone, className)} {...rest} />;
}

export function Notice({
  tone = "info",
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { tone?: "ok" | "warn" | "bad" | "info" }) {
  return <div role={tone === "bad" ? "alert" : "status"} className={cx("notice", tone, className)} {...rest} />;
}

/* ---------------- chips ---------------- */

export function Chip({
  selected = false,
  soft = false,
  className,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean; soft?: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx("chip", selected && "on", soft && "soft", className)}
      {...rest}
    />
  );
}

/* ---------------- forms ---------------- */

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("field", className)}>
      <label className="lbl" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <span className="tiny" style={{ color: "var(--bad)" }} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="tiny">{hint}</span>
      ) : null}
    </div>
  );
}

export function TextInput({
  icon,
  invalid = false,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { icon?: IconName; invalid?: boolean }) {
  return (
    <div className={cx("input", className)} aria-invalid={invalid || undefined}>
      {icon ? <Icon name={icon} size={19} strokeWidth={1.8} /> : null}
      <input aria-invalid={invalid || undefined} {...rest} />
    </div>
  );
}

/* ---------------- toggles ---------------- */

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onCheckedChange?: (next: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className="row"
      style={{ gap: 14, flexWrap: "nowrap", textAlign: "left", opacity: disabled ? 0.5 : 1 }}
    >
      <span className={cx("sw", checked && "on")} aria-hidden="true" />
      <span className="col" style={{ gap: 1 }}>
        <b style={{ fontSize: 14.5 }}>{label}</b>
        {description ? <span className="tiny">{description}</span> : null}
      </span>
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: ReadonlyArray<{ value: T; label: ReactNode }>;
  value: T;
  onChange?: (next: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cx("seg glass flat", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={cx(o.value === value && "on")}
          onClick={() => onChange?.(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Counter({
  value,
  onChange,
  min = 0,
  max = 99,
  label,
}: {
  value: number;
  onChange?: (next: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="counter" role="group" aria-label={label}>
      <button type="button" aria-label={`Quitar: ${label}`} disabled={value <= min} onClick={() => onChange?.(Math.max(min, value - 1))}>
        <Icon name="minus" size={16} />
      </button>
      <b aria-live="polite">{value}</b>
      <button type="button" aria-label={`Agregar: ${label}`} disabled={value >= max} onClick={() => onChange?.(Math.min(max, value + 1))}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}

/* ---------------- data ---------------- */

export function Kpi({ label, value, note, className }: { label: ReactNode; value: ReactNode; note?: ReactNode; className?: string }) {
  return (
    <div className={cx("kpi glass flat", className)}>
      <span>{label}</span>
      <b>{value}</b>
      {note ? <em>{note}</em> : null}
    </div>
  );
}

export function Steps({ items }: { items: ReadonlyArray<{ label: ReactNode; state: "done" | "current" | "todo" }> }) {
  return (
    <ol className="steps" aria-label="Pasos">
      {items.map((s, i) => (
        <li key={i} className={cx("s", s.state === "current" && "on", s.state === "done" && "done")} aria-current={s.state === "current" ? "step" : undefined}>
          <i>{s.state === "done" ? <Icon name="check" size={13} strokeWidth={3} /> : i + 1}</i>
          {s.label}
        </li>
      ))}
    </ol>
  );
}
