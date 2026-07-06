import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Easing } from "framer-motion";

const EASE: Easing = [0.65, 0, 0.35, 1];
const WORD_DURATION = 0.7;
const WORD_GAP = 0.3;
const HOLD_MS = 500;
const FADE_MS = 400;

const LINES = ["Pack", "with", "Me"];

const REVEAL_MS = Math.round((LINES.length * (WORD_DURATION + WORD_GAP)) * 1000);

function Word({ text, delay }: { text: string; delay: number }) {
  return (
    <motion.span
      className="relative z-10 inline-block whitespace-nowrap"
      style={{ clipPath: "inset(-25% 100% -25% -25%)" }}
      animate={{ clipPath: "inset(-25% 0% -25% -25%)" }}
      transition={{ delay, duration: WORD_DURATION, ease: EASE }}
    >
      {text}
    </motion.span>
  );
}

function HeartDoodle({ delay }: { delay: number }) {
  return (
    <motion.svg
      width="0.5em"
      height="0.5em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="relative z-10 ml-1 inline-block align-middle"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
    >
      <path d="M12 20.5s-7.2-4.4-9.7-9C.6 8 2 4.5 5.5 4.5c2 0 3.5 1.1 4.5 2.6 1-1.5 2.5-2.6 4.5-2.6 3.5 0 4.9 3.5 3.2 7-2.5 4.6-9.7 9-9.7 9z" />
    </motion.svg>
  );
}

/** One-time-per-load splash screen shown before the login screen renders. */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), REVEAL_MS + HOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            backgroundImage: "url(/splash/gingham-tile.jpg)",
            backgroundRepeat: "repeat",
            backgroundSize: "234px 234px",
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS / 1000, ease: "easeInOut" }}
        >
          <div
            className="font-cursive relative z-10 flex flex-col items-center text-center leading-[0.95]"
            style={{ color: "#4a3520", fontSize: "clamp(3rem, 13vw, 5.5rem)" }}
          >
            {LINES.map((text, i) => (
              <div key={text} className="flex">
                <Word text={text} delay={i * (WORD_DURATION + WORD_GAP)} />
                {text === "Me" && (
                  <HeartDoodle delay={LINES.length * (WORD_DURATION + WORD_GAP) - WORD_GAP} />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
