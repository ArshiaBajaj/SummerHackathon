import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Siren,
  Mic,
  BarChart3,
  Cpu,
  WifiOff,
  DollarSign,
  Sparkles,
  ArrowRight,
  Camera,
  Trophy,
  Share2,
  Radio,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useGame } from "@/state/gameStore";

const pillars = [
  {
    icon: Siren,
    title: "Autonomous Referee",
    body:
      "OpenCV court mapping + on-device object tracking triggers an instant whistle the moment the ball crosses the line — killing 20% of pickup-game arguments before they start.",
    accent: "from-court-accent to-court-accent2",
  },
  {
    icon: Mic,
    title: "Playground Commentary",
    body:
      "Event-driven text-to-speech monitors score, streaks, and momentum swings — mimicking a broadcast booth right there on the sideline.",
    accent: "from-court-neon to-emerald-400",
  },
  {
    icon: BarChart3,
    title: "Zero-Cost Pro Scouting",
    body:
      "Post-game vertical, release velocity, shot mechanics, and heatmap — bundled into a verified public link so every kid finally has film.",
    accent: "from-court-lime to-court-neon",
  },
];

const stats = [
  { label: "Ref shortage", value: "40%", sub: "youth officials gone in 3 years" },
  { label: "Talent gap", value: "4×", sub: "less access for low-income youth" },
  { label: "Market", value: "$68.7B", sub: "sports tech by 2030 · 14.9% CAGR" },
  { label: "Hardware", value: "$0", sub: "one phone. that's the whole rig." },
];

const flow = [
  { icon: Camera, title: "Place phone", body: "Mount on the fence or a $9 tripod. Any angle works." },
  { icon: Radio, title: "Play the game", body: "Ref, commentator, and scout all boot up simultaneously." },
  { icon: Trophy, title: "Get metrics", body: "Vertical, release, heatmap, highlights — automatic." },
  { icon: Share2, title: "Share the film", body: "Send a verified scout card link to any recruiter." },
];

export function Landing() {
  const loadDemo = useGame((s) => s.loadDemoData);
  return (
    <div className="space-y-16 md:space-y-24">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-court-panel/50 p-6 md:p-12">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-court-grad" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)] court-lines" />

        <div className="grid gap-10 md:grid-cols-[1.15fr_1fr] md:items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2"
            >
              <span className="chip">
                <Sparkles className="h-3 w-3" />
                VS Hacks Submission
              </span>
              <span className="chip">100% Edge AI</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="font-display text-4xl leading-[1.05] tracking-tight md:text-6xl"
            >
              Any public park.
              <br />
              <span className="bg-gradient-to-r from-court-accent via-court-accent2 to-court-lime bg-clip-text text-transparent">
                Pro-level intelligence.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-white/70 md:text-lg"
            >
              Anact Ortho turns a single mounted smartphone into a real-time
              referee, commentator, and scout — powered entirely by on-device
              computer vision. No cloud, no wearables, no subscription. Just
              hoop.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link to="/calibrate" className="btn-primary">
                <Camera className="h-4 w-4" />
                Start a session
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/film" className="btn-ghost">
                <Radio className="h-4 w-4" />
                Watch real NBA breakdowns
              </Link>
              <Link to="/analytics" className="btn-ghost" onClick={loadDemo}>
                <Sparkles className="h-4 w-4" />
                See a demo dashboard
              </Link>
            </motion.div>

            <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-white/50">
              <span className="chip">
                <Cpu className="h-3 w-3" />
                MediaPipe on-device
              </span>
              <span className="chip">
                <WifiOff className="h-3 w-3" />
                Works offline
              </span>
              <span className="chip">
                <DollarSign className="h-3 w-3" />
                No hardware cost
              </span>
            </div>
          </div>

          <BroadcastMock />
        </div>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="panel p-5">
            <div className="stat-label">{s.label}</div>
            <div className="stat-num mt-1">{s.value}</div>
            <div className="mt-1 text-xs text-white/50">{s.sub}</div>
          </div>
        ))}
      </section>

      {/* Pillars */}
      <section>
        <SectionHeader
          kicker="Three pillars, one phone"
          title="A whole broadcast crew inside your pocket"
          body="We built the equivalent of a $50,000 sports-tech stack — the referee stand, the announcer booth, and the analytics lab — and squeezed it into an offline-first PWA."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: 0.05 * i }}
              className="panel relative overflow-hidden p-6"
            >
              <div
                className={`absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${p.accent} opacity-25 blur-2xl`}
              />
              <div className="relative">
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${p.accent} text-black shadow-glow`}
                >
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {p.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Flow */}
      <section>
        <SectionHeader
          kicker="How it works"
          title="Frictionless setup, elite output"
          body="No sensor vests. No smart balls. No cloud upload waiting for a 5G bar."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {flow.map((s, i) => (
            <div key={s.title} className="panel relative p-5">
              <div className="absolute right-4 top-4 font-mono text-xs text-white/30">
                {String(i + 1).padStart(2, "0")}
              </div>
              <s.icon className="h-6 w-6 text-court-accent" />
              <div className="mt-3 font-semibold">{s.title}</div>
              <p className="mt-1.5 text-sm text-white/60">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Equity block */}
      <section className="panel relative overflow-hidden p-6 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-court-accent/10 via-transparent to-court-neon/10" />
        <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <div className="chip mb-4">
              <Sparkles className="h-3 w-3" />
              The equity angle
            </div>
            <h2 className="font-display text-3xl md:text-4xl">
              Talent shouldn't be gated by a $883-a-season club fee.
            </h2>
            <p className="mt-4 max-w-2xl text-white/70">
              Modern scouting demands digital highlights and verified metrics —
              things private academies charge thousands for. Anact Ortho
              collapses that pipeline into a free download so a kid at a public
              park has the same data trail as a five-star recruit at IMG.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Public parks activated" value="Every court" />
            <MiniStat label="Subscription cost" value="$0" />
            <MiniStat label="Model runtime" value="On-device" />
            <MiniStat label="Data uploaded" value="None." />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-court-panel to-black p-8 text-center md:p-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,91,31,0.28),transparent)]" />
        <Logo className="justify-center" withWordmark={false} />
        <h3 className="mx-auto mt-6 max-w-2xl font-display text-3xl md:text-5xl">
          Every kid, every court, every jump —{" "}
          <span className="text-court-accent">on the record.</span>
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-white/60">
          Point your phone at the game. We'll take it from here.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/calibrate" className="btn-primary">
            <Camera className="h-4 w-4" />
            Launch Anact Ortho
          </Link>
          <Link to="/profile" className="btn-ghost">
            <Share2 className="h-4 w-4" />
            View sample scout card
          </Link>
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="stat-label">{label}</div>
      <div className="mt-1 font-display text-xl">{value}</div>
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-court-accent">
        {kicker}
      </div>
      <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
      <p className="mt-3 text-white/60">{body}</p>
    </div>
  );
}

function BroadcastMock() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="scanlines relative overflow-hidden rounded-3xl border border-white/10 bg-black p-4 shadow-glow"
    >
      <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-court-rose" />
          Live · Rooftop Court #3
        </span>
        <span>Q3 · 07:42</span>
      </div>

      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        {/* faux court */}
        <div className="absolute inset-0">
          <svg viewBox="0 0 400 250" className="h-full w-full">
            <defs>
              <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5b3a12" />
                <stop offset="100%" stopColor="#2a1a06" />
              </linearGradient>
            </defs>
            <polygon
              points="40,220 360,220 300,60 100,60"
              fill="url(#floor)"
              stroke="#f5c377"
              strokeOpacity="0.7"
              strokeWidth="1.5"
            />
            <ellipse
              cx="200"
              cy="150"
              rx="60"
              ry="18"
              fill="none"
              stroke="#f5c377"
              strokeOpacity="0.7"
              strokeWidth="1.2"
            />
            <line x1="200" y1="60" x2="200" y2="220" stroke="#f5c377" strokeOpacity="0.3" strokeWidth="1" />
            {/* players (skeleton hint) */}
            <g stroke="#22d3ee" strokeWidth="1.6" fill="none" opacity="0.9">
              <circle cx="150" cy="130" r="6" fill="#22d3ee" />
              <path d="M150 136 L150 160 M150 145 L140 155 M150 145 L160 155 M150 160 L145 175 M150 160 L155 175" />
            </g>
            <g stroke="#ff5b1f" strokeWidth="1.6" fill="none" opacity="0.9">
              <circle cx="240" cy="160" r="6" fill="#ff5b1f" />
              <path d="M240 166 L240 190 M240 175 L230 185 M240 175 L250 185 M240 190 L235 205 M240 190 L245 205" />
            </g>
            {/* ball */}
            <circle cx="215" cy="120" r="5" fill="#ff8a3d" stroke="#050914" strokeWidth="1" />
            {/* trajectory */}
            <path
              d="M150 130 Q 190 90 215 120"
              stroke="#ff5b1f"
              strokeDasharray="3 3"
              strokeWidth="1.2"
              fill="none"
              opacity="0.7"
            />
          </svg>
        </div>

        {/* HUD */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between">
          <div className="rounded-lg bg-black/60 px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-court-accent" />
              Team A <span className="font-mono">24</span>
            </div>
          </div>
          <div className="rounded-lg bg-black/60 px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-court-neon" />
              Team B <span className="font-mono">21</span>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between">
          <div className="rounded-lg bg-black/60 px-2.5 py-1.5 text-[10px] uppercase tracking-widest text-court-lime backdrop-blur">
            Streak · Team A ×3
          </div>
          <div className="rounded-lg bg-black/60 px-2.5 py-1.5 text-[10px] uppercase tracking-widest text-court-neon backdrop-blur">
            Release · 8.4 m/s
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-white/60">
        <Mic className="h-3.5 w-3.5 text-court-accent" />
        <span className="line-clamp-1">
          "From downtown! Team A drills the three, 24 to 21."
        </span>
      </div>
    </motion.div>
  );
}
