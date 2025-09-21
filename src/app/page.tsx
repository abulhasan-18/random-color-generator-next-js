"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type RGB = { r: number; g: number; b: number };

// --- Color utils (same logic as your HTML) ---
const rand = () => Math.floor(Math.random() * 256);
const toHex = ({ r, g, b }: RGB) =>
  (
    "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
  ).toUpperCase();
const rgbStr = ({ r, g, b }: RGB) => `${r}, ${g}, ${b}`;
const luminance = ({ r, g, b }: RGB) => {
  const srgb = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};
// NEW: HSL formatter
const hslStr = ({ r, g, b }: RGB) => {
  const rr = r / 255,
    gg = g / 255,
    bb = b / 255;
  const max = Math.max(rr, gg, bb),
    min = Math.min(rr, gg, bb);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rr:
        h = (gg - bb) / d + (gg < bb ? 6 : 0);
        break;
      case gg:
        h = (bb - rr) / d + 2;
        break;
      case bb:
        h = (rr - gg) / d + 4;
        break;
    }
    h /= 6;
  }
  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);
  return `${H}, ${S}%, ${L}%`;
};

export default function Page() {
  // color state
  const [color, setColor] = useState<RGB>(() => ({ r: 108, g: 92, b: 231 })); // initial #6C5CE7
  const [copied, setCopied] = useState<null | "hex" | "rgb" | "hsl">(null);
  const [pulseKey, setPulseKey] = useState(0); // to restart pulse animation

  const hex = useMemo(() => toHex(color), [color]);
  const rgb = useMemo(() => rgbStr(color), [color]);
  const hsl = useMemo(() => hslStr(color), [color]);
  const tone = useMemo(
    () => (luminance(color) > 0.6 ? "light" : "dark"),
    [color]
  );

  // reflect color into CSS var --current + background wash (like your HTML)
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--current", hex);
    // Enhance body bg subtly with color wash (global style targets body)
    const body = document.body as HTMLBodyElement;
    body.style.background = `
      radial-gradient(1200px 800px at 10% 10%, ${hex}22, transparent 60%),
      radial-gradient(900px 700px at 90% 20%, ${hex}18, transparent 60%),
      linear-gradient(180deg, #0a0a0d 0%, #0f1117 100%)
    `;
  }, [hex]);

  const setColorRandom = useCallback(() => {
    const next: RGB = { r: rand(), g: rand(), b: rand() };
    setColor(next);
    // restart pulse animation
    setPulseKey((k) => k + 1);
  }, []);

  // Copy with Clipboard API (with fallback) + transient UI state
  const copyText = useCallback(
    async (text: string, key: "hex" | "rgb" | "hsl") => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setCopied(key);
        setTimeout(() => setCopied(null), 1400);
      } catch {
        // noop
      }
    },
    []
  );

  // Keyboard shortcuts: Space / G to generate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      const k = e.key.toLowerCase();
      if (k === " " || k === "g") {
        e.preventDefault();
        setColorRandom();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setColorRandom]);

  // First paint: generate once (same behavior as HTML)
  useEffect(() => {
    setColorRandom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Top Bar */}
      <div className="nav" role="navigation" aria-label="Top">
        <img src="/logo.png" alt="Logo" />
        <span className="brand">Random Color Generator</span>
      </div>

      {/* Main */}
      <main className="wrap">
        <section className="card" aria-live="polite">
          <div className="title">
            <h1>Instant Colors. Copy &amp; go.</h1>
            <button
              type="button"
              className="gen"
              aria-label="Generate new color"
              onClick={setColorRandom}
            >
              {/* spark icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Generate
              <span key={pulseKey} className="genPulse" />
            </button>
          </div>

          <div className="grid">
            {/* Swatch */}
            <div className="swatchWrap">
              <div
                className="swatch"
                role="img"
                aria-label={`Color preview ${hex} (RGB ${rgb}) ${tone} tone`}
                style={{ background: hex }}
              />
            </div>

            {/* Codes */}
            <div className="codes">
              {/* HEX */}
              <div>
                <div className="label">Hex</div>
                <div className="codeRow">
                  <div className="value" id="hexValue">
                    {hex}
                  </div>
                  <button
                    type="button"
                    className={`copy ${copied === "hex" ? "copied" : ""}`}
                    aria-label="Copy HEX"
                    onClick={() => void copyText(hex, "hex")}
                  >
                    {copied === "hex" ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              </div>

              {/* RGB */}
              <div>
                <div className="label">RGB</div>
                <div className="codeRow">
                  <div className="value" id="rgbValue">
                    {rgb}
                  </div>
                  <button
                    type="button"
                    className={`copy ${copied === "rgb" ? "copied" : ""}`}
                    aria-label="Copy RGB"
                    onClick={() => void copyText(rgb, "rgb")}
                  >
                    {copied === "rgb" ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              </div>

              {/* HSL (NEW) */}
              <div>
                <div className="label">HSL</div>
                <div className="codeRow">
                  <div className="value" id="hslValue">
                    {hsl}
                  </div>
                  <button
                    type="button"
                    className={`copy ${copied === "hsl" ? "copied" : ""}`}
                    aria-label="Copy HSL"
                    onClick={() => void copyText(hsl, "hsl")}
                  >
                    {copied === "hsl" ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              </div>

              <p className="hint">
                Press <span className="kbd">Space</span> or{" "}
                <span className="kbd">G</span> to generate a new color.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Styles (same as before) */}
      <style jsx global>{`
        :root {
          --bg: #0b0b0f;
          --card: rgba(255, 255, 255, 0.08);
          --stroke: rgba(255, 255, 255, 0.12);
          --text: #eaeaf2;
          --muted: #b5b8c5;
          --accent: #25d366;
          --shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
          --radius: 18px;
          --current: #6c5ce7;
        }
        * {
          box-sizing: border-box;
        }
        html,
        body {
          height: 100%;
        }
        body {
          margin: 0;
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto,
            "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji",
            "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          color: var(--text);
          background: radial-gradient(
              1200px 800px at 10% 10%,
              rgba(255, 255, 255, 0.06),
              transparent 60%
            ),
            radial-gradient(
              900px 700px at 90% 20%,
              rgba(255, 255, 255, 0.04),
              transparent 60%
            ),
            linear-gradient(180deg, #0a0a0d 0%, #0f1117 100%);
          min-height: 100%;
          display: grid;
          grid-template-rows: auto 1fr;
        }
      `}</style>

      <style jsx>{`
        .nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--stroke);
          background: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .nav img {
          width: 28px;
          height: 28px;
          border-radius: 6px;
        }
        .nav .brand {
          color: var(--text);
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .wrap {
          display: grid;
          place-items: center;
          padding: 24px;
        }

        .card {
          width: min(680px, 92vw);
          border: 1px solid var(--stroke);
          background: var(--card);
          box-shadow: var(--shadow);
          border-radius: var(--radius);
          padding: 28px;
          position: relative;
          overflow: hidden;
        }
        .card::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: calc(var(--radius) + 2px);
          padding: 2px;
          background: conic-gradient(
            from 0deg,
            color-mix(in oklab, var(--current) 70%, white),
            transparent 30%,
            transparent 70%,
            color-mix(in oklab, var(--current) 70%, white)
          );
          -webkit-mask: linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.15;
          pointer-events: none;
        }

        .title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }
        .title h1 {
          margin: 0;
          font-size: clamp(20px, 2.4vw, 28px);
          font-weight: 800;
          letter-spacing: 0.4px;
        }

        .gen {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 1px solid var(--stroke);
          background: #0d0f15;
          color: var(--text);
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.2s ease,
            border-color 0.2s ease;
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
          user-select: none;
          position: relative;
          overflow: hidden;
        }
        .gen:hover {
          transform: translateY(-1px);
          border-color: color-mix(in oklab, var(--current) 65%, white 10%);
        }
        .gen:active {
          transform: translateY(0);
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 720px) {
          .grid {
            grid-template-columns: 1.1fr 0.9fr;
          }
        }

        .swatchWrap {
          display: grid;
          place-items: center;
          padding: 12px;
        }
        .swatch {
          width: min(280px, 60vw);
          aspect-ratio: 1 / 1;
          border-radius: 28px;
          background: var(--current);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }
        .swatch::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            320px 220px at 70% 20%,
            rgba(255, 255, 255, 0.22),
            transparent 45%
          );
          mix-blend-mode: soft-light;
          pointer-events: none;
        }
        .swatch:hover {
          transform: scale(1.02);
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.55);
        }

        .codes {
          display: grid;
          gap: 14px;
          align-content: start;
          padding: 8px;
        }

        .codeRow {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 10px;
          border: 1px solid var(--stroke);
          background: rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 12px 12px 12px 14px;
        }
        .label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--muted);
          margin-bottom: 6px;
        }
        .value {
          font-family: "Rubik", Inter, ui-monospace, SFMono-Regular, Menlo,
            Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-weight: 600;
          font-size: 18px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .copy {
          border: 1px solid var(--stroke);
          background: white;
          color: #0f1117;
          padding: 10px 12px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.2s ease,
            color 0.2s ease, border-color 0.2s ease;
        }
        .copy:hover {
          transform: translateY(-1px);
        }
        .copy.copied {
          background: var(--accent);
          color: white;
          border-color: transparent;
        }

        .hint {
          margin-top: 14px;
          font-size: 12px;
          color: var(--muted);
          text-align: center;
        }
        .kbd {
          display: inline-block;
          border: 1px solid var(--stroke);
          border-bottom-width: 2px;
          background: rgba(255, 255, 255, 0.05);
          padding: 1px 6px;
          border-radius: 6px;
          font-size: 11px;
          margin: 0 2px;
        }

        .genPulse {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0;
          animation: pulse 0.6s ease-out;
        }
        @keyframes pulse {
          0% {
            opacity: 0.4;
            box-shadow: 0 0 0 0
              color-mix(in oklab, var(--current) 50%, transparent);
          }
          100% {
            opacity: 0;
            box-shadow: 0 0 0 22px transparent;
          }
        }
      `}</style>
    </>
  );
}
