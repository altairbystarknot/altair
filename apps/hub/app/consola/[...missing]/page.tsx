import { notFound } from "next/navigation";

// Unknown console paths get the console's own not-found page.
export default function Missing() {
  notFound();
}
