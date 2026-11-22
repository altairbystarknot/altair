import { notFound } from "next/navigation";

// Any unknown path under /es or /en renders this language's not-found page.
export default function Missing() {
  notFound();
}
