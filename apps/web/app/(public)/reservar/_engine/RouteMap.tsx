"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import type { RouteMapData } from "./types";

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/**
 * OpenStreetMap panel: the road route between pickup and destination in the business's colours.
 * Leaflet is loaded on demand in the browser; tiles come from OpenStreetMap (attribution shown).
 * Without a route it shows whichever end is known, or the middle of the business's service area.
 */
export function RouteMap({ data, label, center }: { data: RouteMapData | null; label: string; center: { lat: number; lng: number; zoom: number } }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const lib = useRef<typeof Leaflet | null>(null);
  const latest = useRef<RouteMapData | null>(data);
  const home = useRef(center);

  const draw = (L: typeof Leaflet, d: RouteMapData | null) => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    const pin = (cls: string) => L.divIcon({ className: `be-map-pin ${cls}`, html: "<span></span>", iconSize: [26, 26], iconAnchor: [13, 13] });
    const bounds: [number, number][] = [];
    const css = getComputedStyle(el.current ?? document.body);
    const line = css.getPropertyValue("--lg-color-ocean-900").trim() || "#002b42";
    if (d?.points && d.points.length > 1) {
      L.polyline(d.points, { color: "#fffdf8", weight: 9, opacity: 0.95, lineCap: "round", lineJoin: "round" }).addTo(g);
      L.polyline(d.points, { color: line, weight: 4.5, opacity: 0.95, lineCap: "round", lineJoin: "round" }).addTo(g);
      bounds.push(...d.points);
    }
    if (d?.from) { L.marker(d.from, { icon: pin("be-map-pin--a"), keyboard: false }).addTo(g); bounds.push(d.from); }
    if (d?.to) { L.marker(d.to, { icon: pin("be-map-pin--b"), keyboard: false }).addTo(g); bounds.push(d.to); }
    if (bounds.length >= 2) m.fitBounds(L.latLngBounds(bounds), { padding: [36, 36], maxZoom: 13, animate: true });
    else if (bounds.length === 1) m.setView(bounds[0]!, 11, { animate: true });
    else m.setView([home.current.lat, home.current.lng], home.current.zoom);
  };

  // Create the map once (browser only); it is torn down with the component.
  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    void import("leaflet").then((mod) => {
      const L = (mod as unknown as { default?: typeof Leaflet }).default ?? (mod as unknown as typeof Leaflet);
      if (cancelled || !el.current || map.current) return;
      lib.current = L;
      // Phones and tablets: one finger always scrolls the page (the map never catches it); pinch and the
      // +/− buttons still zoom, and the route is framed automatically.
      const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
      const m = L.map(el.current, { zoomControl: true, scrollWheelZoom: false, dragging: !touch, touchZoom: true, attributionControl: true }).setView([home.current.lat, home.current.lng], home.current.zoom);
      m.attributionControl.setPrefix("");
      L.tileLayer(TILES, { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>' }).addTo(m);
      map.current = m;
      layer.current = L.layerGroup().addTo(m);
      draw(L, latest.current);
      // The pane changes size as the steps change: keep the route framed.
      ro = new ResizeObserver(() => { m.invalidateSize(); if (lib.current) draw(lib.current, latest.current); });
      ro.observe(el.current);
    });
    return () => { cancelled = true; ro?.disconnect(); map.current?.remove(); map.current = null; layer.current = null; };
  }, []);

  // Redraw when the route changes.
  useEffect(() => {
    latest.current = data;
    if (lib.current) draw(lib.current, data);
  }, [data]);

  return <div ref={el} className="be-map" role="img" aria-label={label} />;
}
