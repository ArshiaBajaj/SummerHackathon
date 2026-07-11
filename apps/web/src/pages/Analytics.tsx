import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  Download,
  Flame,
  Share2,
  Trophy,
  Zap,
  Target,
  Timer,
  ArrowRight,
  Camera,
} from "lucide-react";
import { useGame } from "@/state/gameStore";
import type { GameEvent, HeatCell, PlayerProfile } from "@/state/gameStore";

export function Analytics() {
  const { lastResult, players, events, heat, scoreA, scoreB, elapsed, loadDemoData } =
    useGame();

  const snap = lastResult;

  const dataPlayers = snap?.players ?? players;
  const dataEvents = snap?.events ?? events;
  const dataHeat = snap?.heat ?? heat;
  const dataScoreA = snap?.scoreA ?? scoreA;
  const dataScoreB = snap?.scoreB ?? scoreB;
  const dataDuration = snap?.duration ?? elapsed;

  const hasData = dataEvents.length > 0 || dataHeat.length > 0;

  if (!hasData) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="panel p-8 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-court-accent" />
          <h1 className="mt-4 font-display text-2xl">No game on record yet</h1>
          <p className="mt-2 text-white/60">
            Run a session and Anact Ortho will fill this dashboard with pro-grade
            metrics — vertical, release velocity, shot mechanics, heatmap, and a
            highlight reel. Or load a sample dataset to preview.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link to="/calibrate" className="btn-primary">
              <Camera className="h-4 w-4" /> Start a session
            </Link>
            <button className="btn-ghost" onClick={loadDemoData}>
              Load sample data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-court-accent">
            Post-game intelligence
          </div>
          <h1 className="font-display text-3xl md:text-4xl">Match report</h1>
          <p className="mt-1 text-white/60">
            {snap ? "Latest snapshot" : "Live in-progress snapshot"} · Duration{" "}
            {formatDuration(dataDuration)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/profile" className="btn-primary">
            <Share2 className="h-4 w-4" /> View scout card
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            className="btn-ghost"
            onClick={() => exportSnapshot(dataPlayers, dataEvents, dataHeat)}
          >
            <Download className="h-4 w-4" /> Export JSON
          </button>
        </div>
      </header>

      {/* Scoreboard */}
      <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="panel p-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
            Final Score
          </div>
          <div className="flex items-center justify-between gap-6">
            <TeamPill team="A" score={dataScoreA} color="#ff5b1f" won={dataScoreA >= dataScoreB} />
            <div className="text-center">
              <div className="font-display text-4xl">–</div>
              <div className="mt-2 text-xs uppercase tracking-widest text-white/40">
                {formatDuration(dataDuration)}
              </div>
            </div>
            <TeamPill team="B" score={dataScoreB} color="#22d3ee" won={dataScoreB > dataScoreA} />
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3">
            <KPI label="Total events" value={dataEvents.length} icon={BarChart3} />
            <KPI
              label="Scoring plays"
              value={dataEvents.filter((e) => e.kind === "score").length}
              icon={Trophy}
            />
            <KPI
              label="Whistles"
              value={dataEvents.filter((e) => e.kind === "whistle" || e.kind === "out_of_bounds").length}
              icon={Zap}
            />
            <KPI label="Data points" value={dataHeat.length} icon={Flame} />
          </div>
        </div>

        <div className="panel p-6">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
            Momentum
          </div>
          <MomentumChart events={dataEvents} duration={dataDuration} />
        </div>
      </section>

      {/* Heatmap + Highlights */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/50">
              Court heatmap
            </div>
            <div className="text-xs text-white/40">{dataHeat.length} samples</div>
          </div>
          <Heatmap cells={dataHeat} />
          <div className="mt-3 flex items-center gap-3 text-xs text-white/50">
            <span className="chip">
              <Target className="h-3 w-3" /> Density-weighted
            </span>
            <span className="chip">On-device projection</span>
          </div>
        </div>

        <div className="panel p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/50">
              Highlights
            </div>
            <div className="text-xs text-white/40">Auto-selected</div>
          </div>
          <HighlightReel events={dataEvents} />
        </div>
      </section>

      {/* Player breakdown */}
      <section>
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-court-accent">
          Player breakdown
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {dataPlayers.map((p) => (
            <PlayerCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* Event log */}
      <section className="panel p-6">
        <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
          Event log
        </div>
        <div className="max-h-[380px] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-court-panel/95 text-[10px] uppercase tracking-widest text-white/40 backdrop-blur">
              <tr>
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Kind</th>
                <th className="py-2 pr-3">Team</th>
                <th className="py-2 pr-3">Value</th>
                <th className="py-2 pr-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {dataEvents
                .slice()
                .sort((a, b) => a.t - b.t)
                .map((e) => (
                  <tr key={e.id} className="border-t border-white/5">
                    <td className="py-2 pr-3 font-mono text-white/60">
                      {formatDuration(e.t)}
                    </td>
                    <td className="py-2 pr-3">{e.kind.replace("_", " ")}</td>
                    <td className="py-2 pr-3 text-white/70">{e.team ?? "—"}</td>
                    <td className="py-2 pr-3 font-mono text-white/70">
                      {e.value?.toFixed?.(1) ?? "—"}
                    </td>
                    <td className="py-2 pr-3 text-white/60">{e.text ?? ""}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TeamPill({
  team,
  score,
  color,
  won,
}: {
  team: "A" | "B";
  score: number;
  color: string;
  won: boolean;
}) {
  return (
    <div
      className={`flex-1 rounded-2xl border p-5 transition ${
        won ? "border-court-accent/40 bg-court-accent/10" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        Team {team}
      </div>
      <div className="mt-2 font-display text-5xl font-semibold">{score}</div>
      {won ? (
        <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-court-accent">
          <Trophy className="mr-1 -mt-0.5 inline h-3 w-3" />W
        </div>
      ) : null}
    </div>
  );
}

function KPI({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between text-white/40">
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="mt-1 font-display text-xl">{value}</div>
    </div>
  );
}

function PlayerCard({ p }: { p: PlayerProfile }) {
  const acc = p.shots > 0 ? Math.round((p.makes / p.shots) * 100) : 0;
  return (
    <div className="panel relative overflow-hidden p-6">
      <div
        className="absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-25 blur-2xl"
        style={{ background: p.color }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-white/50">
              Team {p.team}
            </div>
            <div className="mt-1 font-display text-2xl">{p.name}</div>
          </div>
          <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-sm">
            {p.points} pts
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat label="Vertical" value={`${p.bestJumpCm.toFixed(0)}cm`} icon={Zap} />
          <Stat label="Top release" value={`${p.topReleaseMps.toFixed(1)} m/s`} icon={Target} />
          <Stat label="Distance" value={`${p.distanceM.toFixed(0)}m`} icon={Timer} />
        </div>

        <div className="mt-5">
          <div className="mb-1 flex items-center justify-between text-xs text-white/50">
            <span>Shot accuracy</span>
            <span className="font-mono text-white/70">
              {p.makes}/{p.shots} · {acc}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${acc}%` }}
              transition={{ duration: 0.7 }}
              className="h-full rounded-full"
              style={{ background: p.color }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-white/40">
        <Icon className="h-3 w-3" />
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="mt-1 font-display text-lg">{value}</div>
    </div>
  );
}

function MomentumChart({
  events,
  duration,
}: {
  events: GameEvent[];
  duration: number;
}) {
  const points = useMemo(() => {
    let a = 0;
    let b = 0;
    const pts: { t: number; diff: number }[] = [{ t: 0, diff: 0 }];
    events
      .filter((e) => e.kind === "score")
      .sort((x, y) => x.t - y.t)
      .forEach((e) => {
        const v = e.value ?? 2;
        if (e.team === "A") a += v;
        else b += v;
        pts.push({ t: e.t, diff: a - b });
      });
    pts.push({ t: duration, diff: pts[pts.length - 1]?.diff ?? 0 });
    return pts;
  }, [events, duration]);

  const maxAbs = Math.max(
    4,
    ...points.map((p) => Math.abs(p.diff)),
  );
  const w = 320;
  const h = 140;
  const toX = (t: number) => (t / Math.max(duration, 1)) * w;
  const toY = (d: number) => h / 2 - (d / maxAbs) * (h / 2 - 8);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.t)} ${toY(p.diff)}`)
    .join(" ");

  const areaAbove =
    `M 0 ${h / 2} ` +
    points.map((p) => `L ${toX(p.t)} ${toY(Math.max(0, p.diff))}`).join(" ") +
    ` L ${w} ${h / 2} Z`;
  const areaBelow =
    `M 0 ${h / 2} ` +
    points.map((p) => `L ${toX(p.t)} ${toY(Math.min(0, p.diff))}`).join(" ") +
    ` L ${w} ${h / 2} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="momA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5b1f" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ff5b1f" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="momB" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1="0"
        x2={w}
        y1={h / 2}
        y2={h / 2}
        stroke="rgba(255,255,255,0.15)"
        strokeDasharray="2 3"
      />
      <path d={areaAbove} fill="url(#momA)" />
      <path d={areaBelow} fill="url(#momB)" />
      <path d={path} fill="none" stroke="#fff" strokeWidth="1.4" strokeOpacity="0.85" />
      <text x="4" y="12" fontSize="9" fill="#ff5b1f" opacity="0.8">Team A up</text>
      <text x="4" y={h - 6} fontSize="9" fill="#22d3ee" opacity="0.8">Team B up</text>
    </svg>
  );
}

function Heatmap({ cells }: { cells: HeatCell[] }) {
  const cols = 24;
  const rows = 14;
  const grid = useMemo(() => {
    const g: number[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => 0),
    );
    cells.forEach((c) => {
      const cx = Math.max(0, Math.min(cols - 1, Math.floor(c.x * cols)));
      const cy = Math.max(0, Math.min(rows - 1, Math.floor(c.y * rows)));
      g[cy][cx] += c.w;
    });
    return g;
  }, [cells]);
  const max = Math.max(1, ...grid.flat());

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 to-black">
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <polygon points="6,54 94,54 84,10 16,10" fill="#3a250d" stroke="#f5c377" strokeOpacity="0.55" strokeWidth="0.4" />
        <ellipse cx="50" cy="32" rx="16" ry="6" fill="none" stroke="#f5c377" strokeOpacity="0.55" strokeWidth="0.4" />
        <line x1="50" y1="10" x2="50" y2="54" stroke="#f5c377" strokeOpacity="0.4" strokeWidth="0.3" strokeDasharray="1 1" />
        {grid.flatMap((row, y) =>
          row.map((v, x) => {
            const intensity = v / max;
            if (intensity < 0.02) return null;
            const px = (x / cols) * 100;
            const py = (y / rows) * 60;
            const r = 1.6 + intensity * 3;
            return (
              <circle
                key={`${x}-${y}`}
                cx={px + 100 / cols / 2}
                cy={py + 60 / rows / 2}
                r={r}
                fill={intensity > 0.66 ? "#ff5b1f" : intensity > 0.33 ? "#ffb020" : "#22d3ee"}
                fillOpacity={0.35 + intensity * 0.5}
              />
            );
          }),
        )}
      </svg>
    </div>
  );
}

function HighlightReel({ events }: { events: GameEvent[] }) {
  const clips = events
    .filter((e) => e.kind === "score" || e.kind === "jump" || e.kind === "highlight")
    .sort((a, b) => b.t - a.t)
    .slice(0, 8);
  if (clips.length === 0)
    return <div className="text-sm text-white/50">No highlights recorded yet.</div>;
  return (
    <ul className="space-y-2">
      {clips.map((e) => (
        <li
          key={e.id}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3"
        >
          <div className="flex h-10 w-14 items-center justify-center rounded-md bg-black text-[10px] font-mono text-white/60">
            {formatDuration(e.t)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {e.kind === "score"
                ? `${e.value}-pointer, Team ${e.team}`
                : e.kind === "jump"
                  ? `${(e.value ?? 0).toFixed(0)}cm vertical`
                  : (e.text ?? "Highlight")}
            </div>
            <div className="text-[11px] text-white/50">
              {e.kind.toUpperCase()} · Team {e.team ?? "—"}
            </div>
          </div>
          <span className="chip">Auto-clipped</span>
        </li>
      ))}
    </ul>
  );
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function exportSnapshot(
  players: PlayerProfile[],
  events: GameEvent[],
  heat: HeatCell[],
) {
  const blob = new Blob(
    [JSON.stringify({ players, events, heat }, null, 2)],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `anact-ortho-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
