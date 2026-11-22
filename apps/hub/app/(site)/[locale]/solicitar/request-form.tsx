"use client";

import { useActionState } from "react";
import { Icon } from "@altair/ui";
import { submitRequest, type FormState } from "../../../actions";
import type { Dict, Locale } from "../../../_i18n/copy";

const initial: FormState = { error: null };

type Copy = Dict["request"]["form"];

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
  max = 120,
  optional,
  auto,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  max?: number;
  optional?: string;
  auto?: string;
}) {
  return (
    <div className="h-field">
      <label htmlFor={name}>
        {label}
        {optional ? <small>{optional}</small> : null}
      </label>
      <input
        className="h-inp"
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={max}
        autoComplete={auto}
      />
    </div>
  );
}

/** "Request your Altair": business, services, contact. Posts to the submitRequest server action. */
export function RequestForm({ locale, copy, optional }: { locale: Locale; copy: Copy; optional: string }) {
  const [state, action, pending] = useActionState(submitRequest, initial);
  const services = [
    { v: "transfers", ...copy.transfers },
    { v: "activities", ...copy.activities },
  ];
  return (
    <form action={action} className="h-form">
      <input type="hidden" name="locale" value={locale} />

      <fieldset className="h-fs">
        <legend><span className="h-num">01</span>{copy.business}</legend>
        <Field name="business" label={copy.businessName} required placeholder={copy.businessPh} auto="organization" />
        <div className="h-two">
          <Field name="country" label={copy.country} placeholder={copy.countryPh} max={60} auto="country-name" />
          <Field name="website" label={copy.website} placeholder={copy.websitePh} max={200} optional={optional} auto="url" />
        </div>
      </fieldset>

      <fieldset className="h-fs">
        <legend><span className="h-num">02</span>{copy.services}</legend>
        <div className="h-opts">
          {services.map((c) => (
            <label key={c.v} className="h-opt">
              <input type="checkbox" name="services" value={c.v} defaultChecked />
              <span className="h-box" aria-hidden="true"><Icon name="check" size={14} strokeWidth={3} /></span>
              <span className="h-opt-text">
                <b>{c.t}</b>
                <span>{c.d}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="h-fs">
        <legend><span className="h-num">03</span>{copy.contact}</legend>
        <div className="h-two">
          <Field name="contactName" label={copy.name} required auto="name" />
          <Field name="whatsapp" label={copy.whatsapp} type="tel" placeholder={copy.whatsappPh} max={40} auto="tel" />
        </div>
        <Field name="email" label={copy.email} type="email" required max={200} placeholder={copy.emailPh} auto="email" />
        <div className="h-field">
          <label htmlFor="notes">
            {copy.notes}
            <small>{optional}</small>
          </label>
          <textarea className="h-inp" id="notes" name="notes" rows={4} maxLength={1000} placeholder={copy.notesPh} />
        </div>
      </fieldset>

      <div aria-hidden="true" className="h-hp">
        <label>
          Company URL
          <input name="company_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.error ? <p className="h-error" role="alert">{state.error}</p> : null}
      <button type="submit" className="btn tint lg h-submit" disabled={pending}>
        {pending ? copy.sending : copy.submit} {pending ? null : <Icon name="arrowRight" size={18} />}
      </button>
      <p className="h-privacy">{copy.privacy}</p>
    </form>
  );
}
