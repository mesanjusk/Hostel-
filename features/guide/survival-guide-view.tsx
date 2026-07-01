"use client";

import { useState } from "react";
import Link from "next/link";
import { Caveat } from "next/font/google";
import { motion } from "framer-motion";
import {
  Luggage,
  Smile,
  HeartCrack,
  DoorOpen,
  Plug,
  ShowerHead,
  Shirt,
  UtensilsCrossed,
  Users,
  ShieldAlert,
  Clock,
  MessageCircleHeart,
  Wallet,
  Sparkles,
  ArrowRight,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"] });

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

function GridBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(to_right,#00000009_1px,transparent_1px),linear-gradient(to_bottom,#00000009_1px,transparent_1px)] [background-size:28px_28px]"
    />
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-b border-stone-200/70 px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="mb-1 text-xs font-semibold tracking-[0.2em] text-stone-400 uppercase">
            {eyebrow}
          </p>
          <h2 className="mb-8 text-2xl font-bold text-stone-800 sm:text-3xl">{title}</h2>
          {children}
        </motion.div>
      </div>
    </section>
  );
}

function TipCard({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-stone-200 bg-white/80 p-5 shadow-sm shadow-stone-200/50 transition-shadow hover:shadow-md"
    >
      <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
        <Icon className="size-4.5" />
      </div>
      <p className="font-semibold text-stone-800">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-stone-500">{description}</p>
    </motion.div>
  );
}

function HighlightBox({
  tone = "warning",
  children,
}: {
  tone?: "warning" | "success";
  children: React.ReactNode;
}) {
  const isWarning = tone === "warning";
  const Icon = isWarning ? AlertTriangle : CheckCircle2;
  return (
    <div
      className={`mt-6 flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm ${
        isWarning
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-emerald-200 bg-emerald-50 text-emerald-900"
      }`}
    >
      <Icon className="mt-0.5 size-4.5 shrink-0" />
      <p className="font-medium">{children}</p>
    </div>
  );
}

function ChecklistLine({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-700">
      <CheckCircle2 className="size-4 shrink-0 text-stone-400" />
      {children}
    </li>
  );
}

export function SurvivalGuideView() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="relative -m-4 bg-[#f7f3ec] text-stone-800 lg:-m-8">
      {/* HERO */}
      <section className="relative overflow-hidden px-5 pt-16 pb-20 text-center sm:px-8 sm:pt-24 sm:pb-28">
        <GridBackdrop />
        <div className="pointer-events-none absolute top-10 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-100/60 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto flex max-w-2xl flex-col items-center gap-5"
        >
          <div className="flex items-center gap-2 rounded-full border border-stone-300 bg-white/70 px-4 py-1.5 text-xs font-medium text-stone-500">
            <Luggage className="size-3.5" />
            First-time hostel students, this one&apos;s for you
          </div>

          <h1 className="text-4xl leading-[1.1] font-bold text-stone-900 sm:text-6xl">
            Hostel{" "}
            <span className={`${caveat.className} text-amber-600`} style={{ fontWeight: 700 }}>
              Survival
            </span>{" "}
            Guide
          </h1>

          <p className="max-w-md text-base text-stone-500 sm:text-lg">
            Everything no one tells you before move-in day.
          </p>

          <a
            href="#mental-prep"
            className="group mt-2 inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Start Preparing
            <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" />
          </a>
        </motion.div>
      </section>

      {/* STICKY SECTION NAV */}
      <nav className="sticky top-0 z-20 border-y border-stone-200 bg-[#f7f3ec]/90 backdrop-blur-md">
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto px-5 py-3 sm:justify-center sm:px-8">
          {NAV_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setActiveSection(s.id)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                activeSection === s.id
                  ? "border-stone-800 bg-stone-800 text-white"
                  : "border-stone-300 bg-white/70 text-stone-600 hover:border-stone-400"
              }`}
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      {/* INTRO */}
      <section className="border-b border-stone-200/70 px-5 py-14 text-center sm:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-lg leading-relaxed text-stone-600"
        >
          Moving to hostel for the first time is exciting <em>and</em> a little overwhelming —
          new room, new people, zero idea where anything is. This guide won&apos;t make it
          perfect, but it&apos;ll help you actually survive the first few weeks and, honestly,
          start enjoying it.
        </motion.p>
      </section>

      {/* MENTAL PREP */}
      <Section id="mental-prep" eyebrow="Before anything else" title="Get your head right 🧠">
        <div className="grid gap-4 sm:grid-cols-3">
          <TipCard
            icon={Smile}
            title="The first week feels awkward"
            description="That's completely normal. Everyone's faking confidence on day one — you're not behind."
          />
          <TipCard
            icon={HeartCrack}
            title="Homesickness hits randomly"
            description="Usually around day 4-5, out of nowhere. It passes faster than it feels like it will."
            delay={0.05}
          />
          <TipCard
            icon={DoorOpen}
            title="Don't isolate yourself"
            description="Keep your door open (literally) the first week. The awkward hallway hi's become your first friendships."
            delay={0.1}
          />
        </div>
      </Section>

      {/* ROOM SETUP */}
      <Section id="room-setup" eyebrow="Day one move-in" title="Room setup strategy 🛏️">
        <div className="grid gap-4 sm:grid-cols-2">
          <TipCard icon={Plug} title="Bed near a plug point" description="You will regret it every single night if you don't. Claim it early." />
          <TipCard icon={ShowerHead} title="Avoid washroom-side beds" description="Foot traffic, noise, and smell at 2am. Trust the seniors on this one." delay={0.05} />
          <TipCard icon={Sparkles} title="Use an extension board" description="One socket is never enough once phone, laptop, and lamp all need charging." delay={0.1} />
          <TipCard icon={Luggage} title="Keep a bedside organizer" description="Glasses, charger, water — everything within arm's reach for 3am emergencies." delay={0.15} />
        </div>
      </Section>

      {/* ELECTRICITY & GADGETS */}
      <Section id="electronics" eyebrow="Power struggles" title="Electricity & gadget hacks 🔌">
        <div className="grid gap-4 sm:grid-cols-2">
          <TipCard icon={Plug} title="Charging competition is real" description="Limited sockets, multiple roommates. Charge overnight, not right before you need to leave." />
          <TipCard icon={Sparkles} title="Label your chargers" description="A strip of tape with your name saves so many 'wait, is this mine?' conversations." delay={0.05} />
          <TipCard icon={Wallet} title="Keep a power bank ready" description="Hostel power cuts happen when you least expect them — usually mid-assignment." delay={0.1} />
          <TipCard icon={Plug} title="Use a proper multi-plug" description="Not a cheap one. A short circuit is not how you want to meet the warden." delay={0.15} />
        </div>
        <HighlightBox tone="warning">
          Don&apos;t leave gadgets unattended in common areas, even &quot;just for a second.&quot;
        </HighlightBox>
      </Section>

      {/* BATHROOM */}
      <Section id="bathroom" eyebrow="The daily battle" title="Bathroom survival 🚿">
        <div className="grid gap-4 sm:grid-cols-3">
          <TipCard icon={Clock} title="Avoid peak hours" description="7-8:30am is chaos. Shower at 6:30am or after 9am and thank yourself later." />
          <TipCard icon={ShowerHead} title="Carry slippers, bucket, mug" description="Shared bathrooms are not barefoot-friendly. Non-negotiable essentials." delay={0.05} />
          <TipCard icon={Luggage} title="Use a portable toiletry caddy" description="Grab-and-go beats juggling five bottles down the hallway every morning." delay={0.1} />
        </div>
      </Section>

      {/* CLOTHING & LAUNDRY */}
      <Section id="laundry" eyebrow="Don't let it pile up" title="Clothing & laundry 👕">
        <div className="grid gap-4 sm:grid-cols-3">
          <TipCard icon={Shirt} title="Plan a laundry system" description="Pick fixed days. 'Whenever I run out of clothes' always turns into a crisis." />
          <TipCard icon={Shirt} title="Don't pile up clothes" description="The chair-pile is a trap. Worn-but-wearable and actually-dirty need separate spots." delay={0.05} />
          <TipCard icon={Sparkles} title="Keep quick outfits ready" description="One grab-and-go outfit for the mornings you wake up 10 minutes late." delay={0.1} />
        </div>
      </Section>

      {/* FOOD */}
      <Section id="food" eyebrow="Fuel matters" title="Food survival 🍜">
        <div className="grid gap-4 sm:grid-cols-2">
          <TipCard icon={UtensilsCrossed} title="Mess food is inconsistent" description="Some days it's great, some days it's questionable. Plan around it, don't fight it." />
          <TipCard icon={Luggage} title="Keep instant food + snacks" description="Noodles, biscuits, something sweet — for the nights mess is a no." delay={0.05} />
          <TipCard icon={Clock} title="Don't skip meals" description="Skipping to 'save time' catches up with you by week two. It's not worth it." delay={0.1} />
        </div>
        <HighlightBox tone="success">
          Energy = mood. Eating properly fixes more bad days than you&apos;d expect.
        </HighlightBox>
      </Section>

      {/* ROOMMATE DYNAMICS */}
      <Section id="roommates" eyebrow="Living with strangers" title="Roommate dynamics 🤝">
        <div className="grid gap-4 sm:grid-cols-3">
          <TipCard icon={Users} title="Respect > friendship" description="You don't need to be best friends. You do need to be considerate roommates." />
          <TipCard icon={DoorOpen} title="Set boundaries early" description="Sleep times, guests, sharing stuff — decide together on day one, not after a fight." delay={0.05} />
          <TipCard icon={MessageCircleHeart} title="Communicate clearly" description="A direct, kind conversation beats weeks of passive-aggressive silence." delay={0.1} />
        </div>
      </Section>

      {/* HYGIENE */}
      <Section id="hygiene" eyebrow="Weekly reset" title="Hygiene checklist 🧺">
        <ul className="grid gap-3 sm:grid-cols-3">
          <ChecklistLine>Change bedsheets</ChecklistLine>
          <ChecklistLine>Clean your space</ChecklistLine>
          <ChecklistLine>Organize your desk</ChecklistLine>
        </ul>
      </Section>

      {/* SAFETY */}
      <Section id="safety" eyebrow="Non-negotiable" title="Safety first 🔒">
        <div className="grid gap-4 sm:grid-cols-3">
          <TipCard icon={ShieldAlert} title="Lock your belongings" description="Even around people you trust. It protects the friendship, not just your stuff." />
          <TipCard icon={MessageCircleHeart} title="Don't overshare" description="New friends are great — your schedule, valuables, and family details can wait." delay={0.05} />
          <TipCard icon={Users} title="Keep emergency contacts handy" description="Warden, parents, a trusted senior — saved and easy to reach, not buried in chats." delay={0.1} />
        </div>
        <Link
          href="/contacts"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-800 underline underline-offset-4 hover:text-amber-700"
        >
          Add your emergency contacts in the app
          <ArrowRight className="size-3.5" />
        </Link>
      </Section>

      {/* ROUTINE */}
      <Section id="routine" eyebrow="Keep it simple" title="A minimal daily routine ⏰">
        <div className="grid gap-4 sm:grid-cols-3">
          <TipCard icon={Clock} title="Fixed wake-up time" description="Even on off days. It's the one habit that keeps everything else on track." />
          <TipCard icon={Sparkles} title="One study/work block" description="Doesn't need to be long — just protected, distraction-free time." delay={0.05} />
          <TipCard icon={Smile} title="Actual chill time" description="Not scrolling-in-bed chill. Something that genuinely resets you." delay={0.1} />
        </div>
      </Section>

      {/* SOCIAL LIFE */}
      <Section id="social" eyebrow="Quality over quantity" title="Social life 🎉">
        <div className="grid gap-4 sm:grid-cols-3">
          <TipCard icon={Users} title="Find 2-3 real people" description="Not a big group — just a few people you can actually be yourself around." />
          <TipCard icon={ShieldAlert} title="Avoid toxic groups" description="If a group makes you anxious more than happy, it's not your people." delay={0.05} />
          <TipCard icon={MessageCircleHeart} title="Don't force friendships" description="Some people click in week one, others in month three. Both are fine." delay={0.1} />
        </div>
      </Section>

      {/* MONEY MANAGEMENT */}
      <Section id="money" eyebrow="Stay in control" title="Money management 💸">
        <div className="grid gap-4 sm:grid-cols-3">
          <TipCard icon={Wallet} title="Track your weekly spend" description="Even a rough estimate beats finding out you're broke on day 20." />
          <TipCard icon={Sparkles} title="Avoid overspending early" description="The first two weeks of 'exploring' add up fast. Pace yourself." delay={0.05} />
          <TipCard icon={ShieldAlert} title="Keep emergency cash aside" description="Separate from your everyday spending money. Don't touch it unless it's real." delay={0.1} />
        </div>
        <Link
          href="/budget"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-800 underline underline-offset-4 hover:text-amber-700"
        >
          Track your spending in the Budget tab
          <ArrowRight className="size-3.5" />
        </Link>
      </Section>

      {/* UNDERRATED ESSENTIALS */}
      <Section id="essentials" eyebrow="Nobody warns you" title="Underrated essentials 🧵">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {["Sewing kit", "Medicine kit", "Locks", "Cloth clips", "Mirror"].map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-stone-200 bg-white/80 px-3 py-6 text-center text-sm font-medium text-stone-700 shadow-sm"
            >
              {item}
            </motion.div>
          ))}
        </div>
        <Link
          href="/checklist"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-800 underline underline-offset-4 hover:text-amber-700"
        >
          These are already in your packing checklist
          <ArrowRight className="size-3.5" />
        </Link>
      </Section>

      {/* FINAL / EMOTIONAL CLOSE */}
      <section className="relative overflow-hidden px-5 py-20 text-center sm:px-8 sm:py-28">
        <GridBackdrop />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto flex max-w-xl flex-col items-center gap-6"
        >
          <p className={`${caveat.className} text-3xl text-amber-700 sm:text-4xl`}>
            One last thing
          </p>
          <p className="text-xl leading-relaxed font-medium text-stone-800 sm:text-2xl">
            Hostel life isn&apos;t about comfort. It&apos;s about growth, independence, and
            stories you&apos;ll never forget.
          </p>
          <Link
            href="/checklist"
            className="group mt-2 inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Start Your Hostel Journey
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
