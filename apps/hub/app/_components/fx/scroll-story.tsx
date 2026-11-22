"use client";

import { useRef, useState, type CSSProperties } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { Icon } from "@altair/ui";
import type { Dict } from "../../_i18n/copy";
import { Star } from "../star";

type Step = { t: string; d: string };
type V = Dict["vision"]["vignettes"];

/** A small, real-looking piece of interface that shows what happens in each step (sample data). */
function Vignette({ i, v }: { i: number; v: V }) {
  if (i === 0) {
    const f = v.form;
    return (
      <div className="vg vg-form">
        <p className="vg-title">{f.title}</p>
        <div className="vg-field"><span>{f.business}</span><b>{f.businessValue}</b></div>
        <div className="vg-field">
          <span>{f.services}</span>
          <div className="vg-chips"><i><Icon name="check" size={12} strokeWidth={2.6} />{f.transfers}</i><i><Icon name="check" size={12} strokeWidth={2.6} />{f.tours}</i></div>
        </div>
        <div className="vg-field"><span>{f.email}</span><b>{f.emailValue}<em className="vg-caret" /></b></div>
        <span className="vg-btn">{f.send} <Icon name="arrowRight" size={14} /></span>
      </div>
    );
  }
  if (i === 1) {
    const c = v.console;
    return (
      <div className="vg vg-list">
        <p className="vg-title">{c.title}</p>
        <div className="vg-row hl">
          <span className="vg-av gold"><Star size={14} /></span>
          <div className="vg-who"><b>{c.business}</b><small>{c.place}</small></div>
          <span className="vg-badge ok pop"><Icon name="check" size={12} strokeWidth={2.6} />{c.approved}</span>
        </div>
        {[0, 1].map((k) => (
          <div className="vg-row" key={k}>
            <span className="vg-av" />
            <div className="vg-who"><i className="vg-bar" style={{ width: k ? "46%" : "62%" }} /><i className="vg-bar thin" style={{ width: k ? "30%" : "38%" }} /></div>
            <span className="vg-badge">{c.review}</span>
          </div>
        ))}
      </div>
    );
  }
  if (i === 2) {
    const l = v.link;
    return (
      <div className="vg vg-link">
        <div className="vg-linkhead">
          <span className="vg-ico"><Icon name="link" size={18} /></span>
          <div><b>{l.title}</b><small>{l.oneUse}</small></div>
        </div>
        <div className="vg-url">
          <Icon name="lock" size={12} strokeWidth={2.2} />
          <span className="vg-urltext">{l.url}</span>
          <span className="vg-copy">
            <span className="a">{l.copy}</span>
            <span className="b"><Icon name="check" size={12} strokeWidth={2.6} />{l.copied}</span>
          </span>
        </div>
      </div>
    );
  }
  if (i === 3) {
    const s = v.setup;
    return (
      <div className="vg vg-setup">
        <div className="vg-setuphead"><p className="vg-title">{s.title}</p><span className="vg-prog"><i /></span></div>
        <ul>
          {s.items.map((x, k) => (
            <li key={x} style={{ "--k": k } as CSSProperties}>
              <span className="vg-check"><Icon name="check" size={12} strokeWidth={2.8} /></span>
              {x}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  const l = v.live;
  return (
    <div className="vg vg-live">
      <div className="vg-livebar"><span className="vg-dots"><i /><i /><i /></span><span className="vg-liveurl"><Icon name="lock" size={11} strokeWidth={2.2} />{l.url}</span></div>
      <div className="vg-livebody">
        <span className="vg-badge ok live"><i className="vg-dot" />{l.online}</span>
        <p className="vg-liveh">{l.headline}</p>
        <i className="vg-bar" style={{ width: "72%" }} />
        <i className="vg-bar thin" style={{ width: "52%" }} />
        <span className="vg-btn sm">{l.book}</span>
      </div>
    </div>
  );
}

/**
 * "How to start" told by scrolling: the section holds still while each step takes the window in turn, with
 * a small piece of interface that shows the step, and a rail fills up as you go. On phones and with reduced
 * motion it becomes a plain list of cards.
 */
export function ScrollStory({ kicker, title, steps, stepLabel, vignettes }: { kicker: string; title: React.ReactNode; steps: Step[]; stepLabel: string; vignettes: V }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(Math.min(steps.length - 1, Math.max(0, Math.floor(v * steps.length * 0.999)))));
  const fill = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const s = steps[step]!;
  return (
    <div ref={ref} className="h-story" style={{ height: `${steps.length * 70 + 40}vh` }}>
      <div className="h-story-pin">
        <div className="h-wrap h-story-grid">
          <div className="h-story-head">
            <p className="h-kicker">{kicker}</p>
            <h2 className="h-h2">{title}</h2>
            <ol className="h-story-rail" aria-hidden="true">
              <motion.span className="h-story-fill" style={{ height: fill }} />
              {steps.map((x, i) => <li key={x.t} className={i <= step ? "on" : undefined}><i />{x.t}</li>)}
            </ol>
          </div>
          <div className="h-story-win" aria-live="polite">
            <div className="h-story-stage" aria-hidden="true">
              <motion.div key={`v${step}`} className="h-story-vg" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                <Vignette i={step} v={vignettes} />
              </motion.div>
              <span className="h-story-sample">{vignettes.sample}</span>
            </div>
            <motion.div key={step} className="h-story-in" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <p className="h-story-label"><span className="h-story-n">{String(step + 1).padStart(2, "0")}</span>{stepLabel} {step + 1} / {steps.length}</p>
              <h3 className="h-story-t">{s.t}</h3>
              <p className="h-story-d">{s.d}</p>
            </motion.div>
          </div>
        </div>
      </div>
      <ol className="h-story-list">
        {steps.map((x, i) => (
          <li key={x.t} data-reveal>
            <div className="h-story-stage sm" aria-hidden="true"><Vignette i={i} v={vignettes} /></div>
            <span className="h-num">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="h-h3">{x.t}</h3>
            <p>{x.d}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
