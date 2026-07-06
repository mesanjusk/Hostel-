import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import {
  Highlight,
  Pasted,
  Polaroid,
  ScribbleArrow,
  ScribbleCircle,
  StickerField,
  StickyNote,
} from "@/components/shared/scrapbook-pieces";

const NAV_SECTIONS = [
  { id: "mental-prep", label: "Mental Prep" },
  { id: "room-setup", label: "Room Setup" },
  { id: "electronics", label: "Power & Gadgets" },
  { id: "bathroom", label: "Bathroom" },
  { id: "laundry", label: "Clothing & Laundry" },
  { id: "food", label: "Food" },
  { id: "roommates", label: "Roommates" },
  { id: "hygiene", label: "Hygiene" },
  { id: "safety", label: "Safety" },
  { id: "routine", label: "Routine" },
  { id: "social", label: "Social Life" },
  { id: "money", label: "Money" },
  { id: "essentials", label: "Essentials" },
];

function SectionTitle({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      className="mb-10 text-center text-4xl font-bold text-[#3a2e2a] sm:text-5xl lg:text-6xl"
      style={{ fontFamily: "var(--font-caveat-guide)" }}
    >
      {children} <span className="not-italic">{emoji}</span>
    </motion.h2>
  );
}

function NoteHeadline({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-xl leading-snug font-bold text-[#3a2e2a] sm:text-2xl lg:text-[1.75rem]"
      style={{ fontFamily: "var(--font-caveat-guide)" }}
    >
      {children}
    </p>
  );
}

function GuideSection({
  id,
  emoji,
  title,
  children,
}: {
  id: string;
  emoji: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="relative scroll-mt-32 px-5 py-24">
      <SectionTitle emoji={emoji}>{title}</SectionTitle>
      {children}
    </section>
  );
}

export function SurvivalGuideView() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="relative -m-4 overflow-x-hidden bg-[#fdf6ee] text-[#3a2e2a] lg:-m-8">
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0" />

      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-5 py-20 text-center sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_20%,#ffd6e8_0%,transparent_45%),radial-gradient(circle_at_75%_15%,#cfeaff_0%,transparent_45%),radial-gradient(circle_at_50%_85%,#e3d9ff_0%,transparent_50%)]" />

        <StickerField
          stickers={[
            { slug: "camera", alt: "camera sticker" },
            { slug: "bow", alt: "bow sticker" },
            { slug: "evil-eye", alt: "evil eye sticker" },
            { slug: "cherries", alt: "cherries sticker" },
          ]}
          seed={10}
        />

        <Pasted
          rotate={-2}
          className="tape max-w-lg bg-white/90 px-8 py-10 shadow-[6px_10px_24px_rgba(58,46,42,0.18)] lg:max-w-2xl lg:px-12 lg:py-14"
        >
          <p className="text-sm font-semibold tracking-[0.3em] text-[#c96b9a] uppercase lg:text-base">
            a survival guide for
          </p>
          <h1
            className="mt-2 text-5xl leading-[1.05] font-bold text-[#3a2e2a] sm:text-7xl lg:text-8xl"
            style={{ fontFamily: "var(--font-caveat-guide)" }}
          >
            Hostel Survival
            <br />
            Guide
          </h1>
          <p className="mt-4 text-base text-[#6b5c50] sm:text-lg lg:text-xl">
            Everything no one tells you before move-in day 💌
          </p>
          <a
            href="#mental-prep"
            className="mt-6 inline-block rotate-[-1deg] rounded-full bg-[#3a2e2a] px-7 py-3 text-sm font-bold text-white shadow-[3px_4px_0_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-0.5 hover:rotate-0 lg:px-9 lg:py-4 lg:text-base"
          >
            Start Preparing →
          </a>
        </Pasted>
      </section>

      {/* STICKY SECTION NAV */}
      <nav className="sticky top-0 z-20 border-y border-[#e9ddc9] bg-[#fdf6ee]/90 backdrop-blur-md">
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto px-5 py-3 sm:justify-center sm:px-8">
          {NAV_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setActiveSection(s.id)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                activeSection === s.id
                  ? "border-[#3a2e2a] bg-[#3a2e2a] text-white"
                  : "border-[#e9ddc9] bg-white/70 text-[#6b5c50] hover:border-[#3a2e2a]/40"
              }`}
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      {/* INTRO */}
      <section className="border-b border-[#e9ddc9] px-5 py-14 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-lg leading-relaxed text-[#5a4a3e] sm:text-xl"
        >
          Moving to hostel for the first time is exciting <em>and</em> a little overwhelming — new room, new
          people, zero idea where anything is. This guide won&apos;t make it perfect, but it&apos;ll help you
          actually survive the first few weeks and, honestly, start enjoying it.
        </motion.p>
      </section>

      {/* MENTAL PREP */}
      <GuideSection id="mental-prep" emoji="💭" title="Get your head right">
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-8">
          <StickyNote color="yellow" rotate={-6} delay={0}>
            <NoteHeadline>The first week feels awkward</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              That&apos;s completely normal. Everyone&apos;s faking confidence on day one — you&apos;re not
              behind.
            </p>
          </StickyNote>
          <StickyNote color="pink" rotate={4} delay={0.1} className="sm:mt-10">
            <NoteHeadline>Homesickness hits randomly</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              Usually around day 4-5, out of nowhere. It passes faster than it feels like it will.
            </p>
          </StickyNote>
          <StickyNote color="blue" rotate={-3} delay={0.2}>
            <NoteHeadline>Don&apos;t isolate yourself</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              Keep your door open (literally) the first week — the awkward hallway hi&apos;s become your
              first friendships 🚪
            </p>
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
      </GuideSection>

      {/* ROOM SETUP */}
      <GuideSection id="room-setup" emoji="🛏️" title="Room setup strategy">
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
      </GuideSection>

      {/* ELECTRONICS */}
      <GuideSection id="electronics" emoji="🔌" title="Power & gadget hacks">
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
          ]}
          seed={11}
        />
        <p className="mt-10 text-center text-2xl font-bold text-[#b5651d] sm:text-3xl lg:text-4xl">
          <Highlight color="#baffc9">don&apos;t leave gadgets unattended</Highlight> — ever.
        </p>
      </GuideSection>

      {/* BATHROOM */}
      <GuideSection id="bathroom" emoji="🚿" title="Bathroom survival">
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-8">
          <StickyNote color="blue" rotate={-4} delay={0}>
            <p className="text-2xl lg:text-3xl">⏰</p>
            <p className="mt-1 text-base font-semibold sm:text-lg lg:text-xl">avoid peak hours</p>
            <p className="mt-2 -rotate-3 text-lg text-[#b5453a] sm:text-xl" style={{ fontFamily: "var(--font-caveat-guide)" }}>
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
      </GuideSection>

      {/* LAUNDRY */}
      <GuideSection id="laundry" emoji="👕" title="Clothing & laundry">
        <StickerField
          stickers={[
            { slug: "laundry-again", alt: "laundry again sticker" },
            { slug: "laundry-day", alt: "laundry day sticker" },
          ]}
          seed={12}
        />
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-8">
          <StickyNote color="yellow" rotate={-5} delay={0}>
            <NoteHeadline>Plan a laundry system</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              Pick fixed days. &quot;Whenever I run out of clothes&quot; always turns into a crisis.
            </p>
          </StickyNote>
          <StickyNote color="lavender" rotate={4} delay={0.1} className="sm:mt-10">
            <NoteHeadline>Don&apos;t pile up clothes</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              The chair-pile is a trap. Worn-but-wearable and actually-dirty need separate spots.
            </p>
          </StickyNote>
          <StickyNote color="pink" rotate={-3} delay={0.2}>
            <NoteHeadline>Keep quick outfits ready</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              One grab-and-go outfit for the mornings you wake up 10 minutes late.
            </p>
          </StickyNote>
        </div>
      </GuideSection>

      {/* FOOD */}
      <GuideSection id="food" emoji="🍜" title="Food survival">
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-8">
          <Polaroid stickerSlug="midnight-maggi" caption="instant noodles" rotate={4} delay={0} />
          <Polaroid stickerSlug="cookies" caption="snack stash" rotate={-6} delay={0.1} className="sm:mt-10" />
          <Polaroid emoji="🍫" caption="don't skip meals" rotate={2} delay={0.2} />
        </div>
        <StickerField
          stickers={[
            { slug: "maggi-therapy", alt: "maggi therapy sticker" },
            { slug: "mess-food-survival-food", alt: "mess food survival food sticker" },
          ]}
          seed={13}
        />
        <p
          className="mx-auto mt-8 max-w-xs rotate-1 text-center text-2xl text-[#3a2e2a] sm:text-3xl lg:max-w-sm lg:text-4xl"
          style={{ fontFamily: "var(--font-caveat-guide)" }}
        >
          <Highlight color="#fff3b0">energy = mood.</Highlight> eat properly, bestie.
        </p>
      </GuideSection>

      {/* ROOMMATES */}
      <GuideSection id="roommates" emoji="👯" title="Roommate dynamics">
        <StickerField
          stickers={[
            { slug: "cat-headphones-bubblegum", alt: "cat with headphones sticker" },
            { slug: "bow-2", alt: "bow sticker" },
          ]}
          seed={14}
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
      </GuideSection>

      {/* HYGIENE */}
      <GuideSection id="hygiene" emoji="🧺" title="Weekly reset">
        <StickerField
          stickers={[
            { slug: "small-steps-every-day", alt: "small steps every day sticker" },
            { slug: "potted-plant", alt: "potted plant sticker" },
          ]}
          seed={15}
        />
        <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-6">
          {["Change bedsheets", "Clean your space", "Organize your desk"].map((item, i) => (
            <Pasted
              key={item}
              rotate={i % 2 === 0 ? -3 : 3}
              delay={i * 0.08}
              className="flex items-center gap-2 rounded-full border-[3px] border-white bg-[#fff3b0] px-6 py-3 text-lg font-semibold text-[#5a4a3e] shadow-[3px_5px_12px_rgba(58,46,42,0.15)]"
            >
              ✔ {item}
            </Pasted>
          ))}
        </div>
      </GuideSection>

      {/* SAFETY */}
      <GuideSection id="safety" emoji="🔒" title="Safety first">
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-8">
          <StickyNote color="lavender" rotate={-5} delay={0}>
            <NoteHeadline>Lock your belongings</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              Even around people you trust. It protects the friendship, not just your stuff.
            </p>
          </StickyNote>
          <StickyNote color="pink" rotate={4} delay={0.1} className="sm:mt-10">
            <NoteHeadline>Don&apos;t overshare</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              New friends are great — your schedule, valuables, and family details can wait.
            </p>
          </StickyNote>
          <StickyNote color="blue" rotate={-3} delay={0.2}>
            <NoteHeadline>Keep emergency contacts handy</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              Warden, parents, a trusted senior — saved and easy to reach, not buried in chats.
            </p>
          </StickyNote>
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/contacts"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-[#3a2e2a] underline underline-offset-4 hover:text-[#8a5a6b]"
          >
            Add your emergency contacts in the app →
          </Link>
        </div>
      </GuideSection>

      {/* ROUTINE */}
      <GuideSection id="routine" emoji="⏰" title="A minimal daily routine">
        <StickerField
          stickers={[
            { slug: "alarm-clock", alt: "alarm clock sticker" },
            { slug: "sleep-is-overrated", alt: "sleep is overrated sticker" },
            { slug: "sleepy-moon", alt: "sleepy moon sticker" },
          ]}
          seed={16}
        />
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-8">
          <StickyNote color="yellow" rotate={-4} delay={0}>
            <NoteHeadline>Fixed wake-up time</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              Even on off days. It&apos;s the one habit that keeps everything else on track.
            </p>
          </StickyNote>
          <StickyNote color="blue" rotate={5} delay={0.1} className="sm:mt-8">
            <NoteHeadline>One study/work block</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              Doesn&apos;t need to be long — just protected, distraction-free time.
            </p>
          </StickyNote>
          <StickyNote color="pink" rotate={-2} delay={0.2}>
            <NoteHeadline>Actual chill time</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              Not scrolling-in-bed chill. Something that genuinely resets you.
            </p>
          </StickyNote>
        </div>
      </GuideSection>

      {/* SOCIAL LIFE */}
      <GuideSection id="social" emoji="🎉" title="Social life">
        <StickerField
          stickers={[
            { slug: "cow-boba", alt: "cow with boba sticker" },
            { slug: "choose-happy", alt: "choose happy sticker" },
            { slug: "room-518-legends", alt: "room 518 legends sticker" },
          ]}
          seed={17}
        />
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-8">
          <StickyNote color="pink" rotate={-4} delay={0}>
            <NoteHeadline>Find 2-3 real people</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              Not a big group — just a few people you can actually be yourself around.
            </p>
          </StickyNote>
          <StickyNote color="lavender" rotate={5} delay={0.1} className="sm:mt-10">
            <NoteHeadline>Avoid toxic groups</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              If a group makes you anxious more than happy, it&apos;s not your people.
            </p>
          </StickyNote>
          <StickyNote color="blue" rotate={-3} delay={0.2}>
            <NoteHeadline>Don&apos;t force friendships</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              Some people click in week one, others in month three. Both are fine.
            </p>
          </StickyNote>
        </div>
      </GuideSection>

      {/* MONEY MANAGEMENT */}
      <GuideSection id="money" emoji="💸" title="Money management">
        <StickerField
          stickers={[
            { slug: "budget-zero-stories-hero", alt: "budget zero stories hero sticker" },
            { slug: "paise-khatam-emotion-khatam", alt: "paise khatam emotion khatam sticker" },
          ]}
          seed={18}
        />
        <div className="mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-8">
          <StickyNote color="yellow" rotate={-5} delay={0}>
            <NoteHeadline>Track your weekly spend</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              Even a rough estimate beats finding out you&apos;re broke on day 20.
            </p>
          </StickyNote>
          <StickyNote color="blue" rotate={4} delay={0.1} className="sm:mt-8">
            <NoteHeadline>Avoid overspending early</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              The first two weeks of &quot;exploring&quot; add up fast. Pace yourself.
            </p>
          </StickyNote>
          <StickyNote color="pink" rotate={-3} delay={0.2}>
            <NoteHeadline>Keep emergency cash aside</NoteHeadline>
            <p className="mt-1 text-base text-[#5a4a3e] sm:text-lg">
              Separate from your everyday spending money. Don&apos;t touch it unless it&apos;s real.
            </p>
          </StickyNote>
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/budget"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-[#3a2e2a] underline underline-offset-4 hover:text-[#8a5a6b]"
          >
            Track your spending in the Budget tab →
          </Link>
        </div>
      </GuideSection>

      {/* UNDERRATED ESSENTIALS */}
      <GuideSection id="essentials" emoji="🎒" title="Underrated essentials">
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
        <div className="mt-8 text-center">
          <Link
            to="/checklist"
            className="inline-flex items-center gap-1.5 text-base font-semibold text-[#3a2e2a] underline underline-offset-4 hover:text-[#8a5a6b]"
          >
            These are already in your packing checklist →
          </Link>
        </div>
      </GuideSection>

      {/* FINAL / EMOTIONAL CLOSE */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-5 py-24 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,#d9c8ff_0%,#b8ddff_45%,#ffc2dd_100%)]" />
        <StickerField
          stickers={[
            { slug: "you-matter", alt: "you matter sticker" },
            { slug: "bunny-tulips", alt: "bunny with tulips sticker" },
            { slug: "tulips-bouquet", alt: "tulips bouquet sticker" },
            { slug: "hostel-life-best-life", alt: "hostel life best life sticker" },
          ]}
          seed={19}
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
            style={{ fontFamily: "var(--font-caveat-guide)" }}
          >
            &ldquo;Hostel life isn&apos;t about comfort. It&apos;s about growth, independence, and stories
            you&apos;ll never{" "}
            <span className="relative inline-block px-1">
              <ScribbleCircle preserveAspectRatio="none" className="inset-0 h-full w-full scale-125 opacity-40" />
              <span className="relative">forget</span>
            </span>
            .&rdquo;
          </p>
          <Link
            to="/checklist"
            className="mt-8 inline-block rotate-1 rounded-full bg-[#3a2e2a] px-8 py-3.5 text-sm font-bold text-white shadow-[4px_5px_0_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-0.5 hover:rotate-0 lg:px-10 lg:py-4 lg:text-base"
          >
            Start Your Hostel Journey →
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
