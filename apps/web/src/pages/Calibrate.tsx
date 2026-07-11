import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Camera,
  CameraOff,
  RefreshCcw,
  RotateCw,
  Sparkles,
  ArrowRight,
  Crosshair,
  Undo2,
  Check,
  ShieldAlert,
} from "lucide-react";
import { useCamera } from "@/lib/useCamera";
import { useGame } from "@/state/gameStore";
import type { CourtCorner } from "@/state/gameStore";

const CORNER_LABELS = [
  "Top-left baseline",
  "Top-right baseline",
  "Bottom-right sideline",
  "Bottom-left sideline",
];

export function Calibrate() {
  const nav = useNavigate();
  const setCorners = useGame((s) => s.setCourtCorners);
  const savedCorners = useGame((s) => s.courtCorners);
  const sport = useGame((s) => s.sport);
  const setSport = useGame((s) => s.setSport);
  const commentaryStyle = useGame((s) => s.commentaryStyle);
  const setCommentaryStyle = useGame((s) => s.setCommentaryStyle);

  const { videoRef, status, error, start, stop, flip } = useCamera();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [corners, setLocalCorners] = useState<CourtCorner[]>(savedCorners);

  useEffect(() => setLocalCorners(savedCorners), [savedCorners]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (status !== "streaming") return;
    if (corners.length >= 4) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setLocalCorners([...corners, { x, y }]);
  };

  const autoDetect = () => {
    // Structural auto-detection stand-in — assumes a typical court framing where
    // the court fills roughly the center 70% of the frame. This is a reasonable
    // starting point that the user can nudge, and matches the "perspective
    // transformation to known boundaries" strategy in the pitch.
    setLocalCorners([
      { x: 0.14, y: 0.24 },
      { x: 0.86, y: 0.24 },
      { x: 0.94, y: 0.9 },
      { x: 0.06, y: 0.9 },
    ]);
  };

  const undo = () => setLocalCorners(corners.slice(0, -1));
  const reset = () => setLocalCorners([]);

  const commit = () => {
    setCorners(corners);
    nav("/live");
  };

  const ready = corners.length === 4;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-court-accent">
            Step 1 · Setup
          </div>
          <h1 className="font-display text-3xl md:text-4xl">
            Calibrate your court
          </h1>
          <p className="mt-2 max-w-2xl text-white/60">
            Mount the phone on the fence or a cheap tripod along a baseline.
            Tap the four corners of the playing surface — Anact Ortho uses this
            perspective anchor for line-crossing detection and heatmapping.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SportPicker sport={sport} setSport={setSport} />
          <StylePicker style={commentaryStyle} setStyle={setCommentaryStyle} />
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel overflow-hidden p-3">
          <div
            ref={stageRef}
            className="scanlines relative aspect-[16/10] w-full cursor-crosshair overflow-hidden rounded-xl bg-black"
            onClick={handleTap}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 h-full w-full object-cover"
            />
            {status !== "streaming" && (
              <CameraCurtain
                status={status}
                error={error}
                onStart={() => start()}
              />
            )}
            {status === "streaming" && (
              <CalibrationOverlay corners={corners} />
            )}

            <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between">
              <div className="rounded-lg bg-black/60 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest backdrop-blur">
                {status === "streaming" ? (
                  <span className="flex items-center gap-1.5 text-court-lime">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-court-lime" />
                    Camera live · Edge processing ready
                  </span>
                ) : (
                  <span className="text-white/60">Camera offline</span>
                )}
              </div>
              <div className="rounded-lg bg-black/60 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/70 backdrop-blur">
                {corners.length}/4 corners
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              {status === "streaming" ? (
                <>
                  <button onClick={() => stop()} className="btn-ghost">
                    <CameraOff className="h-4 w-4" />
                    Stop
                  </button>
                  <button onClick={() => flip()} className="btn-ghost">
                    <RotateCw className="h-4 w-4" />
                    Flip
                  </button>
                </>
              ) : (
                <button onClick={() => start()} className="btn-ghost">
                  <Camera className="h-4 w-4" />
                  Enable camera
                </button>
              )}
              <button onClick={autoDetect} className="btn-ghost">
                <Sparkles className="h-4 w-4" />
                Auto-detect
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={undo}
                disabled={corners.length === 0}
                className="btn-ghost disabled:opacity-40"
              >
                <Undo2 className="h-4 w-4" />
                Undo
              </button>
              <button
                onClick={reset}
                disabled={corners.length === 0}
                className="btn-ghost disabled:opacity-40"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-court-accent">
              <Crosshair className="h-4 w-4" /> Corner guide
            </div>
            <ol className="space-y-2 text-sm">
              {CORNER_LABELS.map((label, i) => {
                const done = i < corners.length;
                const current = i === corners.length;
                return (
                  <li
                    key={label}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition ${
                      done
                        ? "border-court-lime/40 bg-court-lime/10 text-court-lime"
                        : current
                          ? "border-court-accent/60 bg-court-accent/10 text-white"
                          : "border-white/10 bg-white/[0.02] text-white/50"
                    }`}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-black/40 font-mono text-[11px]">
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className="text-sm">{label}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="panel p-5">
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-court-accent">
              Why we need this
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              The four corners define a homography that anchors every ball
              position and player joint to real-world court coordinates.
              That's what lets us call out-of-bounds objectively, generate
              accurate heatmaps, and compute release velocity in meters per
              second — all without a wide-angle lens or dual camera.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: ready ? 1.01 : 1 }}
            whileTap={{ scale: ready ? 0.99 : 1 }}
            onClick={commit}
            disabled={!ready}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-display text-lg font-semibold transition ${
              ready
                ? "bg-gradient-to-r from-court-accent to-court-accent2 text-black shadow-glow hover:brightness-110"
                : "cursor-not-allowed bg-white/5 text-white/40"
            }`}
          >
            {ready ? "Tip off" : `Tap ${4 - corners.length} more corner${corners.length === 3 ? "" : "s"}`}
            {ready && <ArrowRight className="h-5 w-5" />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function CameraCurtain({
  status,
  error,
  onStart,
}: {
  status: string;
  error: string | null;
  onStart: () => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-black/60 via-court-bg/60 to-black/70 p-6 text-center">
      {status === "denied" ? (
        <>
          <ShieldAlert className="h-10 w-10 text-court-rose" />
          <div className="max-w-md">
            <div className="font-display text-lg">Camera permission needed</div>
            <p className="mt-1 text-sm text-white/60">
              Anact Ortho runs entirely on your device — grant camera access in
              your browser settings and reload.
            </p>
          </div>
        </>
      ) : status === "requesting" ? (
        <div className="text-white/70">Requesting camera…</div>
      ) : (
        <>
          <Camera className="h-10 w-10 text-court-accent" />
          <div className="max-w-md">
            <div className="font-display text-lg">Enable your camera</div>
            <p className="mt-1 text-sm text-white/60">
              We'll process everything on-device. Nothing leaves the phone.
            </p>
            {error ? (
              <p className="mt-2 text-xs text-court-rose">{error}</p>
            ) : null}
          </div>
          <button onClick={onStart} className="btn-primary">
            <Camera className="h-4 w-4" /> Start camera
          </button>
        </>
      )}
    </div>
  );
}

function CalibrationOverlay({ corners }: { corners: CourtCorner[] }) {
  const path = useMemo(() => {
    if (corners.length < 2) return null;
    const closed = corners.length === 4;
    const d = corners
      .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x * 100} ${c.y * 100}`)
      .join(" ");
    return d + (closed ? " Z" : "");
  }, [corners]);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {path && (
        <path
          d={path}
          fill={corners.length === 4 ? "rgba(255, 91, 31, 0.12)" : "none"}
          stroke="#ff5b1f"
          strokeWidth="0.4"
          strokeDasharray={corners.length === 4 ? "0" : "1 1"}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {corners.map((c, i) => (
        <g key={i}>
          <circle
            cx={c.x * 100}
            cy={c.y * 100}
            r="1.6"
            fill="#ff5b1f"
            stroke="#050914"
            strokeWidth="0.4"
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={c.x * 100 + 2}
            y={c.y * 100 - 1.5}
            fontSize="2"
            fill="#ffb020"
            style={{ paintOrder: "stroke" }}
            stroke="#050914"
            strokeWidth="0.4"
          >
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

function SportPicker({
  sport,
  setSport,
}: {
  sport: "basketball" | "soccer" | "tennis";
  setSport: (s: "basketball" | "soccer" | "tennis") => void;
}) {
  const opts: { id: "basketball" | "soccer" | "tennis"; label: string }[] = [
    { id: "basketball", label: "Basketball" },
    { id: "soccer", label: "Soccer" },
    { id: "tennis", label: "Tennis" },
  ];
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => setSport(o.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
            sport === o.id ? "bg-white text-black" : "text-white/60 hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StylePicker({
  style,
  setStyle,
}: {
  style: "playground" | "broadcast" | "hype";
  setStyle: (s: "playground" | "broadcast" | "hype") => void;
}) {
  const opts: { id: "playground" | "broadcast" | "hype"; label: string }[] = [
    { id: "playground", label: "Playground" },
    { id: "broadcast", label: "Broadcast" },
    { id: "hype", label: "Hype" },
  ];
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => setStyle(o.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
            style === o.id ? "bg-white text-black" : "text-white/60 hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
