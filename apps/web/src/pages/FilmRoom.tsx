import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Siren,
  Mic,
  Flame,
  TrendingUp,
  Trophy,
  Wifi,
  WifiOff,
  Sparkles,
} from "lucide-react";
import {
  api,
  type FilmEvent,
  type FilmGame,
  type FilmGameDetail,
  type NbaPlayer,
} from "@/lib/api";

// Full 48-minute game, compressed so a replay plays in ~40s at 1×.
const GAME_MS = 4 * 12 * 60 * 1000;
const BASE_SPEED = GAME_MS / 40_000;

// Bundled fallback so the room is never empty if the backend is offline.
const FALLBACK_FILMS: FilmGame[] = [
  {
    id: "luka-73",
    title: "Luka Dončić drops 73",
    subtitle: "3rd-highest single-game total in NBA history",
    date: "2024-01-26",
    season: "2023-24",
    teamA: { tricode: "DAL", name: "Mavericks", color: "#00538C", final: 148 },
    teamB: { tricode: "ATL", name: "Hawks", color: "#E03A3E", final: 143 },
    headline: "Luka pours in 73 to outduel Atlanta in a shootout for the ages.",
    starLine: "Dončić: 73 PTS · 10 REB · 7 AST · 25/33 FG",
    youtubeUrl: "https://www.youtube.com/results?search_query=luka+doncic+73+points+full+highlights",
    durationMs: GAME_MS,
    tags: ["Career-high", "Shootout", "MVP form"],
  },
  {
    id: "finals-g5-2024",
    title: "2024 NBA Finals · Game 5",
    subtitle: "Celtics clinch banner 18",
    date: "2024-06-17",
    season: "2023-24 Playoffs",
    teamA: { tricode: "BOS", name: "Celtics", color: "#007A33", final: 106 },
    teamB: { tricode: "DAL", name: "Mavericks", color: "#00538C", final: 88 },
    headline: "Boston closes the series 4-1; Jaylen Brown takes Finals MVP.",
    starLine: "Tatum: 31 PTS · 11 AST · 8 REB",
    youtubeUrl: "https://www.youtube.com/results?search_query=2024+nba+finals+game+5+highlights",
    durationMs: GAME_MS,
    tags: ["Championship", "Finals MVP", "Clincher"],
  },
];

/** Compact client-side timeline generator — mirror of the server, so the
 *  theater still works with zero backend. */
function localTimeline(film: FilmGame): FilmEvent[] {
  const rand = mulberry(film.id);
  const buckets = (target: number): number[] => {
    const out: number[] = [];
    let r = target;
    while (r > 0) {
      if (r >= 3 && rand() < 0.36) {
        out.push(3);
        r -= 3;
      } else if (r >= 2) {
        out.push(2);
        r -= 2;
      } else {
        out.push(1);
        r -= 1;
      }
    }
    return out;
  };
  type B = { team: "A" | "B"; pts: number };
  const list: B[] = [
    ...buckets(film.teamA.final).map((pts) => ({ team: "A" as const, pts })),
    ...buckets(film.teamB.final).map((pts) => ({ team: "B" as const, pts })),
  ];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  let a = 0;
  let b = 0;
  return list.map((x, idx) => {
    const t = Math.floor(((idx + 0.5) / list.length) * GAME_MS);
    const quarter = Math.min(4, Math.floor(t / (12 * 60_000)) + 1);
    if (x.team === "A") a += x.pts;
    else b += x.pts;
    const name = x.team === "A" ? film.teamA.name : film.teamB.name;
    return {
      id: `${film.id}-${idx}`,
      t,
      quarter,
      clock: "",
      kind: "score",
      team: x.team,
      scoreA: a,
      scoreB: b,
      value: x.pts,
      text: x.pts === 3 ? `${name} drills a three` : `${name} scores`,
    } satisfies FilmEvent;
  });
}

function mulberry(seedStr: string): () => number {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function FilmRoom() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [llm, setLlm] = useState<string>("");
  const [films, setFilms] = useState<FilmGame[]>(FALLBACK_FILMS);
  const [leaders, setLeaders] = useState<NbaPlayer[]>([]);
  const [selected, setSelected] = useState<FilmGameDetail | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const health = await api.health(ctrl.signal);
        setStatus("online");
        setLlm(health.llm);
        const [f, l] = await Promise.all([
          api.films(ctrl.signal),
          api.leaders("ppg", 5, ctrl.signal),
        ]);
        setFilms(f.films);
        setLeaders(l.leaders);
      } catch {
        setStatus("offline");
      }
    })();
    return () => ctrl.abort();
  }, []);

  async function openFilm(film: FilmGame) {
    if (status === "online") {
      try {
        const { film: detail } = await api.film(film.id);
        setSelected(detail);
        return;
      } catch {
        /* fall through to local */
      }
    }
    setSelected({ ...film, timeline: localTimeline(film), boxLeaders: [] });
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-court-accent">
            Film Room · Real NBA games
          </div>
          <h1 className="font-display text-3xl md:text-4xl">
            Watch Anact Ortho break down real basketball
          </h1>
          <p className="mt-2 max-w-2xl text-white/60">
            Real 2023-24 games — real scores, real box-score lines — replayed
            through the exact broadcast engine Anact Ortho runs on the sideline.
            Officiating whistles, momentum, and commentary, all reconstructed
            from the live result.
          </p>
        </div>
        <StatusPill status={status} llm={llm} />
      </header>

      {leaders.length > 0 && <LeaderStrip leaders={leaders} />}

      {selected ? (
        <ReplayTheater film={selected} onClose={() => setSelected(null)} />
      ) : null}

      <section>
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/70">
          <Film className="h-4 w-4 text-court-accent" />
          Select a game to replay
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {films.map((f) => (
            <GameCard key={f.id} film={f} onOpen={() => void openFilm(f)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatusPill({ status, llm }: { status: string; llm: string }) {
  if (status === "online")
    return (
      <span className="chip">
        <Wifi className="h-3 w-3 text-court-lime" />
        Backend live{llm === "enabled" ? " · LLM on" : " · engine"}
      </span>
    );
  if (status === "offline")
    return (
      <span className="chip" title="Run `npm run server:start` for live data">
        <WifiOff className="h-3 w-3 text-court-rose" />
        Backend offline · using bundled data
      </span>
    );
  return <span className="chip">Connecting…</span>;
}

function LeaderStrip({ leaders }: { leaders: NbaPlayer[] }) {
  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-court-accent">
        <Trophy className="h-3.5 w-3.5" /> 2023-24 scoring leaders · live from API
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {leaders.map((p, i) => (
          <div
            key={p.id}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-white/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-white/40">
                {p.team}
              </span>
            </div>
            <div className="mt-1 truncate text-sm font-semibold" title={p.name}>
              {p.name}
            </div>
            <div className="font-display text-2xl text-court-accent">{p.ppg}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">
              PPG · {p.rpg} REB · {p.apg} AST
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GameCard({ film, onOpen }: { film: FilmGame; onOpen: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="panel group relative flex flex-col overflow-hidden p-5"
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-30 blur-2xl"
        style={{ background: film.teamA.color }}
      />
      <div className="relative flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-white/40">
          {film.season} · {new Date(film.date).toLocaleDateString()}
        </span>
      </div>
      <h3 className="relative mt-2 font-display text-xl">{film.title}</h3>
      <p className="relative mt-1 text-xs text-white/50">{film.subtitle}</p>

      <div className="relative mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
        <TeamScore t={film.teamA} win={film.teamA.final > film.teamB.final} />
        <span className="font-mono text-xs text-white/40">FINAL</span>
        <TeamScore t={film.teamB} win={film.teamB.final > film.teamA.final} align="right" />
      </div>

      <div className="relative mt-3 text-xs text-court-lime">{film.starLine}</div>

      <div className="relative mt-3 flex flex-wrap gap-1.5">
        {film.tags.map((t) => (
          <span
            key={t}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/50"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="relative mt-4 flex items-center gap-2">
        <button className="btn-primary flex-1 justify-center" onClick={onOpen}>
          <Play className="h-4 w-4" /> Replay in Anact Ortho
        </button>
        <a
          href={film.youtubeUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost"
          title="Watch real footage on YouTube"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </motion.div>
  );
}

function TeamScore({
  t,
  win,
  align,
}: {
  t: { tricode: string; final: number; color: string };
  win: boolean;
  align?: "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="flex items-center gap-1.5" style={{ flexDirection: align === "right" ? "row-reverse" : "row" }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
        <span className="text-sm font-semibold">{t.tricode}</span>
      </div>
      <div className={`font-display text-2xl ${win ? "text-white" : "text-white/50"}`}>
        {t.final}
      </div>
    </div>
  );
}

function ReplayTheater({
  film,
  onClose,
}: {
  film: FilmGameDetail;
  onClose: () => void;
}) {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [t, setT] = useState(0);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);

  useEffect(() => {
    setT(0);
    setPlaying(true);
  }, [film.id]);

  useEffect(() => {
    if (!playing) return;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = now - last.current;
      last.current = now;
      setT((prev) => {
        const next = prev + dt * BASE_SPEED * speed;
        if (next >= GAME_MS) {
          setPlaying(false);
          return GAME_MS;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, speed, film.id]);

  const shown = useMemo(
    () => film.timeline.filter((e) => e.t <= t),
    [film.timeline, t],
  );
  const current = shown[shown.length - 1];
  const scoreA = current?.scoreA ?? 0;
  const scoreB = current?.scoreB ?? 0;
  const quarter = current?.quarter ?? 1;
  const clock = current?.clock || fmtClock(t);
  const feed = shown.slice(-6).reverse();
  const lastCommentary =
    [...shown].reverse().find((e) => e.text)?.text ?? "Tip-off. Anact Ortho is watching.";
  const progress = Math.min(100, (t / GAME_MS) * 100);

  const total = scoreA + scoreB || 1;
  const shareA = (scoreA / total) * 100;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="scanlines relative overflow-hidden rounded-3xl border border-white/10 bg-black p-4 shadow-glow md:p-6"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-court-rose" />
            Replay · {film.title}
          </span>
          <span className="text-white/30">Q{quarter} · {clock}</span>
        </div>
        <button className="btn-ghost text-xs" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* Court + scoreboard */}
        <div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-black">
            <CourtFloor
              colorA={film.teamA.color}
              colorB={film.teamB.color}
              pulse={current?.kind === "score"}
              pulseTeam={current?.team}
            />
            {/* Scoreboard HUD */}
            <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between">
              <ScoreChip color={film.teamA.color} tri={film.teamA.tricode} score={scoreA} />
              <ScoreChip color={film.teamB.color} tri={film.teamB.tricode} score={scoreB} align />
            </div>
            {/* Latest call */}
            {current && (
              <div className="pointer-events-none absolute inset-x-3 bottom-3">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="inline-flex items-center gap-2 rounded-lg bg-black/70 px-3 py-1.5 text-[11px] backdrop-blur"
                >
                  {current.kind === "whistle" ? (
                    <Siren className="h-3.5 w-3.5 text-court-rose" />
                  ) : current.kind === "streak" ? (
                    <Flame className="h-3.5 w-3.5 text-court-accent" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-court-lime" />
                  )}
                  <span>{current.text}</span>
                </motion.div>
              </div>
            )}
          </div>

          {/* Commentary ticker */}
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
            <Mic className="h-4 w-4 shrink-0 text-court-accent" />
            <span className="line-clamp-1 text-white/80">{lastCommentary}</span>
          </div>

          {/* Momentum bar */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-widest text-white/40">
              <span>{film.teamA.tricode} momentum</span>
              <span>{film.teamB.tricode}</span>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-white/5">
              <div style={{ width: `${shareA}%`, background: film.teamA.color }} />
              <div style={{ width: `${100 - shareA}%`, background: film.teamB.color }} />
            </div>
          </div>

          {/* Transport */}
          <div className="mt-4 flex items-center gap-3">
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-court-accent text-black shadow-glow"
              onClick={() => {
                if (t >= GAME_MS) setT(0);
                setPlaying((p) => !p);
              }}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 hover:bg-white/5"
              onClick={() => {
                setT(0);
                setPlaying(true);
              }}
              aria-label="Restart"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-court-accent to-court-accent2"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                    speed === s
                      ? "bg-white/15 text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Play-by-play + box leaders */}
        <div className="space-y-4">
          {film.boxLeaders.length > 0 && (
            <div className="panel p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-court-accent">
                <TrendingUp className="h-3.5 w-3.5" /> Box-score leaders
              </div>
              <ul className="space-y-2">
                {film.boxLeaders.map((b) => (
                  <li key={b.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: b.team === "A" ? film.teamA.color : film.teamB.color }}
                    />
                    <span className="font-semibold">{b.name}</span>
                    <span className="ml-auto text-xs text-white/50">{b.line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="panel p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-court-accent">
              Live play-by-play
            </div>
            <ul className="space-y-1.5">
              {feed.length === 0 && (
                <li className="text-sm text-white/40">Tip-off…</li>
              )}
              {feed.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-[13px]"
                >
                  <span className="font-mono text-[10px] text-white/30">
                    Q{e.quarter}
                  </span>
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: e.team === "A" ? film.teamA.color : film.teamB.color }}
                  />
                  <span className="line-clamp-1 text-white/75">{e.text}</span>
                  {e.value ? (
                    <span className="ml-auto font-mono text-xs text-court-lime">
                      +{e.value}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <a
            href={film.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost w-full justify-center"
          >
            <ExternalLink className="h-4 w-4" /> Watch the real footage
          </a>
        </div>
      </div>
    </motion.section>
  );
}

function ScoreChip({
  color,
  tri,
  score,
  align,
}: {
  color: string;
  tri: string;
  score: number;
  align?: boolean;
}) {
  return (
    <div className="rounded-lg bg-black/60 px-2.5 py-1.5 text-[12px] font-semibold backdrop-blur">
      <div
        className="flex items-center gap-2"
        style={{ flexDirection: align ? "row-reverse" : "row" }}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {tri} <span className="font-mono text-court-accent">{score}</span>
      </div>
    </div>
  );
}

function CourtFloor({
  colorA,
  colorB,
  pulse,
  pulseTeam,
}: {
  colorA: string;
  colorB: string;
  pulse?: boolean;
  pulseTeam?: "A" | "B";
}) {
  return (
    <svg viewBox="0 0 400 250" className="h-full w-full">
      <defs>
        <linearGradient id="fr-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b3a12" />
          <stop offset="100%" stopColor="#2a1a06" />
        </linearGradient>
      </defs>
      <polygon
        points="40,220 360,220 300,60 100,60"
        fill="url(#fr-floor)"
        stroke="#f5c377"
        strokeOpacity="0.7"
        strokeWidth="1.5"
      />
      <ellipse cx="200" cy="150" rx="60" ry="18" fill="none" stroke="#f5c377" strokeOpacity="0.6" strokeWidth="1.2" />
      <line x1="200" y1="60" x2="200" y2="220" stroke="#f5c377" strokeOpacity="0.25" strokeWidth="1" />
      <g stroke={colorA} strokeWidth="1.6" fill="none" opacity="0.95">
        <circle cx="150" cy="130" r="6" fill={colorA} />
        <path d="M150 136 L150 160 M150 145 L140 155 M150 145 L160 155 M150 160 L145 175 M150 160 L155 175" />
      </g>
      <g stroke={colorB} strokeWidth="1.6" fill="none" opacity="0.95">
        <circle cx="250" cy="160" r="6" fill={colorB} />
        <path d="M250 166 L250 190 M250 175 L240 185 M250 175 L260 185 M250 190 L245 205 M250 190 L255 205" />
      </g>
      {pulse && (
        <motion.circle
          key={Math.random()}
          cx={pulseTeam === "B" ? 250 : 150}
          cy={pulseTeam === "B" ? 160 : 130}
          r="6"
          fill="none"
          stroke={pulseTeam === "B" ? colorB : colorA}
          initial={{ r: 6, opacity: 0.9 }}
          animate={{ r: 40, opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      )}
      <circle cx="215" cy="120" r="5" fill="#ff8a3d" stroke="#050914" strokeWidth="1" />
    </svg>
  );
}

function fmtClock(t: number): string {
  const q = Math.min(4, Math.floor(t / (12 * 60_000)) + 1);
  const inQ = t - (q - 1) * 12 * 60_000;
  const remaining = Math.max(0, 12 * 60_000 - inQ);
  const total = Math.floor(remaining / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
