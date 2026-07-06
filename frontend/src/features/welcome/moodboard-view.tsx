import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import {
  Highlight,
  Pasted,
  Polaroid,
  ScribbleArrow,
  ScribbleCircle,
  StickerField,
  StickyNote,
} from "@/components/shared/scrapbook-pieces";

function SectionTitle({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-10 text-center text-4xl font-bold text-[#3a2e2a] sm:text-5xl lg:text-6xl"
      style={{ fontFamily: "var(--font-caveat-mood)" }}
    >
      {children} <span className="not-italic">{emoji}</span>
    </motion.h2>
  );
}

/** Headline line inside a StickyNote/Pasted bubble — handwritten, sized to stay legible. */
function NoteHeadline({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p
      className={`text-xl leading-snug font-bold text-[#3a2e2a] sm:text-2xl lg:text-[1.75rem] ${className ?? ""}`}
      style={{ fontFamily: "var(--font-caveat-mood)" }}
    >
      {children}
    </p>
  );
}

export function MoodboardView() {
  return (
    <div className="relative overflow-x-hidden bg-[#fdf6ee] text-[#3a2e2a]">
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0" />

      {/* 1. HERO */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-24 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_20%,#ffd6e8_0%,transparent_45%),radial-gradient(circle_at_75%_15%,#cfeaff_0%,transparent_45%),radial-gradient(circle_at_50%_85%,#e3d9ff_0%,transparent_50%)]" />

        <StickerField
          stickers={[
            { slug: "camera", alt: "camera sticker" },
            { slug: "bow", alt: "bow sticker" },
            { slug: "evil-eye", alt: "evil eye sticker" },
            { slug: "cherries", alt: "cherries sticker" },
            { slug: "headphones", alt: "headphones sticker" },
          ]}
          seed={1}
        />

        <Pasted rotate={-3} className="tape max-w-lg bg-white/90 px-8 py-10 shadow-[6px_10px_24px_rgba(58,46,42,0.18)] lg:max-w-2xl lg:px-12 lg:py-14">
          <p className="text-sm font-semibold tracking-[0.3em] text-[#c96b9a] uppercase lg:text-base">
            a survival guide for
          </p>
          <h1
            className="mt-2 text-5xl leading-[1.05] font-bold text-[#3a2e2a] sm:text-7xl lg:text-8xl"
            style={{ fontFamily: "var(--font-caveat-mood)" }}
          >
            Hostel Survival
            <br />
            Guide
          </h1>
          <p className="mt-4 text-base text-[#6b5c50] sm:text-lg lg:text-xl">
            Everything you need before move-in day 💌
          </p>
          <a
            href="#mental-prep"
            className="mt-6 inline-block rotate-[-1deg] rounded-full bg-[#3a2e2a] px-7 py-3 text-sm font-bold text-white shadow-[3px_4px_0_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-0.5 hover:rotate-0 lg:px-9 lg:py-4 lg:text-base"
          >
            Open My Survival Board →
          </a>
        </Pasted>
      </section>

      {/* 2. MENTAL PREP */}
      <section id="mental-prep" className="relative px-5 py-24">
        <SectionTitle emoji="💭">Mental Prep</SectionTitle>
        <StickerField
          stickers={[
            { slug: "okay-not-okay", alt: "it's okay to not be okay sticker" },
            { slug: "trust-the-process", alt: "trust the process sticker" },
            { slug: "good-things-coming", alt: "good things are coming sticker" },
            { slug: "note-to-self", alt: "note to self, you're doing your best sticker" },
          ]}
          seed={2}
        />
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-8">
          <StickyNote color="yellow" rotate={-6} delay={0}>
            <NoteHeadline>First week = chaos.</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">That&apos;s completely normal, promise.</p>
          </StickyNote>
          <StickyNote color="pink" rotate={4} delay={0.1} className="sm:mt-10">
            <NoteHeadline>Homesickness hits randomly</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">usually day 4-5. it passes, fr.</p>
          </StickyNote>
          <StickyNote color="blue" rotate={-3} delay={0.2}>
            <NoteHeadline>Don&apos;t isolate yourself</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">keep the door open (literally) 🚪</p>
          </StickyNote>
        </div>

        <Pasted rotate={-1.5} delay={0.25} className="relative mx-auto mt-10 h-20 w-56 sm:h-24 sm:w-64">
          <img
            src="/stickers/bandaid-everything-okay.png"
            alt="Everything will be okay sticker"
            className="h-full w-full object-contain drop-shadow-[2px_6px_10px_rgba(58,46,42,0.3)]"
            draggable={false}
          />
        </Pasted>
      </section>

      {/* 3. ROOM SETUP */}
      <section className="relative px-5 py-24">
        <SectionTitle emoji="🛏️">Room Setup</SectionTitle>
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-8">
          <Polaroid emoji="🔌" caption="bed near plug ✔" rotate={-5} delay={0} />
          <Polaroid
            stickerSlug="extension-board"
            caption="extension board ✔"
            rotate={3}
            delay={0.1}
            className="sm:mt-8"
          />
          <Polaroid emoji="🗂️" caption="bedside organizer ✔" rotate={-2} delay={0.2} />
        </div>
        <div className="relative mx-auto mt-6 max-w-md text-center">
          <ScribbleArrow className="-top-6 left-1/2 -translate-x-1/2 rotate-90" />
          <p className="text-lg text-[#5a4a3e] sm:text-xl lg:text-2xl">
            trust me on the <Highlight color="#cfeaff">plug point</Highlight> one
          </p>
        </div>
      </section>

      {/* 4. SURVIVAL HACKS */}
      <section className="relative overflow-hidden px-5 py-28">
        <SectionTitle emoji="⚡">Survival Hacks</SectionTitle>
        <div className="relative mx-auto grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-3 lg:max-w-4xl lg:gap-8">
          <StickyNote color="yellow" rotate={7} delay={0} className="max-w-none">
            <p className="text-2xl lg:text-3xl">⚡</p>
            <p className="mt-1 text-base font-semibold sm:text-lg lg:text-xl">charging war is real</p>
          </StickyNote>
          <StickyNote color="blue" rotate={-8} delay={0.1} className="max-w-none sm:mt-12">
            <p className="text-2xl lg:text-3xl">🔌</p>
            <p className="mt-1 text-base font-semibold sm:text-lg lg:text-xl">label your chargers</p>
          </StickyNote>
          <StickyNote color="pink" rotate={4} delay={0.2} className="max-w-none">
            <p className="text-2xl lg:text-3xl">🔋</p>
            <p className="mt-1 text-base font-semibold sm:text-lg lg:text-xl">power bank is life</p>
          </StickyNote>
        </div>
        <StickerField
          stickers={[
            { slug: "charging-myself", alt: "charging myself sticker" },
            { slug: "extension-board", alt: "extension board sticker" },
            { slug: "headphones", alt: "headphones sticker" },
          ]}
          seed={3}
        />
        <p className="mt-10 text-center text-2xl font-bold text-[#b5651d] sm:text-3xl lg:text-4xl">
          <Highlight color="#baffc9">don&apos;t leave gadgets unattended</Highlight> — ever.
        </p>
      </section>

      {/* 5. BATHROOM REALITY */}
      <section className="relative px-5 py-24">
        <SectionTitle emoji="🚿">Bathroom Reality</SectionTitle>
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-8">
          <StickyNote color="blue" rotate={-4} delay={0}>
            <p className="text-2xl lg:text-3xl">⏰</p>
            <p className="mt-1 text-base font-semibold sm:text-lg lg:text-xl">avoid peak hours</p>
            <p className="mt-2 -rotate-3 text-lg text-[#b5453a] sm:text-xl" style={{ fontFamily: "var(--font-caveat-mood)" }}>
              NOPE HOURS: 7-8:30am
            </p>
          </StickyNote>
          <StickyNote color="lavender" rotate={5} delay={0.1} className="sm:mt-8">
            <p className="text-2xl lg:text-3xl">🪣</p>
            <p className="mt-1 text-base font-semibold sm:text-lg lg:text-xl">carry slippers + bucket</p>
          </StickyNote>
          <StickyNote color="pink" rotate={-2} delay={0.2}>
            <p className="text-2xl lg:text-3xl">🧴</p>
            <p className="mt-1 text-base font-semibold sm:text-lg lg:text-xl">portable toiletry kit</p>
          </StickyNote>
        </div>
      </section>

      {/* 6. FOOD SURVIVAL */}
      <section className="relative px-5 py-24">
        <SectionTitle emoji="🍜">Food Survival</SectionTitle>
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-8">
          <Polaroid stickerSlug="midnight-maggi" caption="instant noodles" rotate={4} delay={0} />
          <Polaroid stickerSlug="cookies" caption="snack stash" rotate={-6} delay={0.1} className="sm:mt-10" />
          <Polaroid emoji="🍫" caption="don't skip meals" rotate={2} delay={0.2} />
        </div>
        <p
          className="mx-auto mt-8 max-w-xs rotate-1 text-center text-2xl text-[#3a2e2a] sm:text-3xl lg:max-w-sm lg:text-4xl"
          style={{ fontFamily: "var(--font-caveat-mood)" }}
        >
          <Highlight color="#fff3b0">energy = mood.</Highlight> eat properly, bestie.
        </p>
      </section>

      {/* 7. ROOMMATE VIBES */}
      <section className="relative px-5 py-24">
        <SectionTitle emoji="👯">Roommate Vibes</SectionTitle>
        <StickerField
          stickers={[
            { slug: "cat-headphones-bubblegum", alt: "cat with headphones sticker" },
            { slug: "bow-2", alt: "bow sticker" },
          ]}
          seed={4}
        />
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-5">
          <Pasted
            rotate={-2}
            className="max-w-sm rounded-3xl rounded-bl-md bg-[#cfeaff] px-5 py-4 text-lg font-semibold text-[#22415a] shadow-[3px_5px_12px_rgba(58,46,42,0.15)] sm:text-xl lg:max-w-md lg:text-2xl"
          >
            respect &gt; friendship, always 🤝
          </Pasted>
          <Pasted
            rotate={3}
            delay={0.1}
            className="max-w-sm self-end rounded-3xl rounded-br-md bg-[#ffd6e8] px-5 py-4 text-right text-lg font-semibold text-[#7a2249] shadow-[3px_5px_12px_rgba(58,46,42,0.15)] sm:text-xl lg:max-w-md lg:text-2xl"
          >
            set boundaries early 🚪
          </Pasted>
          <Pasted
            rotate={-1}
            delay={0.2}
            className="max-w-sm rounded-3xl rounded-bl-md bg-[#e3d9ff] px-5 py-4 text-lg font-semibold text-[#3a2966] shadow-[3px_5px_12px_rgba(58,46,42,0.15)] sm:text-xl lg:max-w-md lg:text-2xl"
          >
            communicate clearly, not passive-aggressively 💬
          </Pasted>
        </div>
      </section>

      {/* 8. UNDERRATED ESSENTIALS */}
      <section className="relative px-5 py-24">
        <SectionTitle emoji="🎒">Underrated Essentials</SectionTitle>
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-5 lg:max-w-4xl lg:gap-8">
          {[
            ["🧵", "sewing kit"],
            ["💊", "medicine kit"],
            ["🔒", "locks"],
            ["🪞", "mirror"],
            ["🧷", "cloth clips"],
          ].map(([emoji, label], i) => (
            <Pasted
              key={label}
              rotate={i % 2 === 0 ? -4 : 5}
              delay={i * 0.05}
              className="torn-edge bg-white px-3 py-6 text-center shadow-[3px_5px_12px_rgba(58,46,42,0.15)] lg:py-8"
            >
              <p className="text-3xl lg:text-4xl">{emoji}</p>
              <p className="mt-2 text-sm font-semibold text-[#3a2e2a] sm:text-base lg:text-lg">{label}</p>
            </Pasted>
          ))}
        </div>
      </section>

      {/* 9. FINAL — EMOTIONAL CLOSURE */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-24 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,#d9c8ff_0%,#b8ddff_45%,#ffc2dd_100%)]" />
        <StickerField
          stickers={[
            { slug: "you-matter", alt: "you matter sticker" },
            { slug: "bunny-tulips", alt: "bunny with tulips sticker" },
            { slug: "tulips-bouquet", alt: "tulips bouquet sticker" },
            { slug: "evil-eye", alt: "evil eye sticker" },
          ]}
          seed={5}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-xl lg:max-w-2xl"
        >
          <p
            className="text-3xl leading-tight text-[#3a2e2a] sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-caveat-mood)" }}
          >
            &ldquo;Hostel life isn&apos;t comfort. It&apos;s chaos, independence, and memories you&apos;ll
            never{" "}
            <span className="relative inline-block px-1">
              <ScribbleCircle preserveAspectRatio="none" className="inset-0 h-full w-full scale-125 opacity-40" />
              <span className="relative">forget</span>
            </span>
            .&rdquo;
          </p>
        </motion.div>
      </section>

      {/* Persistent FAB — always reachable while scrolling the board */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed right-5 bottom-5 z-50 sm:right-8 sm:bottom-8"
      >
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#3a2e2a] px-6 py-3.5 text-sm font-bold text-white shadow-[4px_6px_16px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5 active:scale-95 sm:px-7 sm:py-4 sm:text-base"
        >
          Start Your Hostel Era ✨
        </Link>
      </motion.div>
    </div>
  );
}
