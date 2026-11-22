import type { SVGProps } from "react";

// The design system's inline icons — only the ones this site uses. Decorative by default (aria-hidden).

type IconProps = SVGProps<SVGSVGElement>;
const base = (p: IconProps): IconProps => ({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, focusable: false, ...p });

export const ArrowRightIcon = (p: IconProps) => (<svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const CloseIcon = (p: IconProps) => (<svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const LeafIcon = (p: IconProps) => (<svg {...base(p)}><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z" /><path d="M5 19c3-4 6-7 10-9" /></svg>);
export const PinIcon = (p: IconProps) => (<svg {...base(p)}><path d="M12 21s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11Z" /><circle cx="12" cy="10" r="2.2" /></svg>);
export const ClockIcon = (p: IconProps) => (<svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>);
export const UsersIcon = (p: IconProps) => (<svg {...base(p)}><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><circle cx="17" cy="9.5" r="2.2" /><path d="M15.5 14.2c2.8 0 5 1.8 5 4.3" /></svg>);
export const LuggageIcon = (p: IconProps) => (<svg {...base(p)}><rect x="5" y="7" width="14" height="13" rx="2" /><path d="M9 7V4h6v3M9 20v1M15 20v1" /></svg>);
export const WifiIcon = (p: IconProps) => (<svg {...base(p)}><path d="M3 9c5.5-5 12.5-5 18 0M6.5 12.5c3.3-3 7.7-3 11 0M10 16c1.2-1.1 2.8-1.1 4 0" /><circle cx="12" cy="19" r="0.8" fill="currentColor" /></svg>);
export const ShieldIcon = (p: IconProps) => (<svg {...base(p)}><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>);
export const StarIcon = (p: IconProps) => (<svg {...base(p)}><path d="m12 3.5 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.8l6.1-.7L12 3.5Z" /></svg>);
export const HeartIcon = (p: IconProps) => (<svg {...base(p)}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" /></svg>);
export const MailIcon = (p: IconProps) => (<svg {...base(p)}><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></svg>);
export const PhoneIcon = (p: IconProps) => (<svg {...base(p)}><path d="M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" /></svg>);
export const InstagramIcon = (p: IconProps) => (<svg {...base(p)}><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><circle cx="12" cy="12" r="3.8" /><circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" /></svg>);
export const FacebookIcon = (p: IconProps) => (<svg {...base(p)}><path d="M14 8h2.5V4.5H14a4 4 0 0 0-4 4V11H7.5v3.5H10V21h3.5v-6.5H16l.5-3.5h-3V8.8c0-.5.2-.8.5-.8Z" /></svg>);
export const WhatsAppIcon = (p: IconProps) => (<svg {...base(p)}><path d="M4 20l1.3-3.8A8.5 8.5 0 1 1 8.1 19L4 20Z" /><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-.9-.9.9c-1.3-.5-2.4-1.6-2.9-2.9l.9-.9-.9-2H9Z" /></svg>);
export const TikTokIcon = (p: IconProps) => (<svg {...base(p)}><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 4c.5 2.5 2.2 4 4.5 4.3" /></svg>);
export const PlaneIcon = (p: IconProps) => (<svg {...base(p)}><path d="M3 12.5 21 6l-4 14-4.5-5.5L3 12.5Z" /><path d="m12.5 14.5 3-3" /></svg>);
export const CarIcon = (p: IconProps) => (<svg {...base(p)}><path d="M4 14 6 8.5A2 2 0 0 1 8 7h8a2 2 0 0 1 2 1.5L20 14v4H4v-4Z" /><circle cx="7.5" cy="17" r="1.4" /><circle cx="16.5" cy="17" r="1.4" /><path d="M5 14h14" /></svg>);

export const socialIconFor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("insta")) return InstagramIcon;
  if (n.includes("face")) return FacebookIcon;
  if (n.includes("whats")) return WhatsAppIcon;
  if (n.includes("tik")) return TikTokIcon;
  if (n.includes("mail")) return MailIcon;
  return ArrowRightIcon;
};
