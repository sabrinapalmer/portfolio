import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Resolves once web fonts are ready (or after a short timeout), so text
 *  animations don't start in a fallback font and then jump. */
const useFontsReady = () => {
  const [ready, setReady] = useState(
    typeof document === "undefined" || !("fonts" in document)
  );
  useEffect(() => {
    if (ready) return;
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    document.fonts.ready.then(finish);
    const t = window.setTimeout(finish, 1200);
    return () => window.clearTimeout(t);
  }, [ready]);
  return ready;
};

/** Letters spring in one by one and wobble on hover. Words never break
 *  in the middle. */
export const BouncyText: React.FC<{
  text: string;
  className?: string;
  delay?: number;
  colors?: string[];
}> = ({ text, className, delay = 0, colors }) => {
  const reduce = useReducedMotion();
  const fontsReady = useFontsReady();
  let index = 0;

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text.split(" ").map((word, w, words) => (
          <React.Fragment key={w}>
            <span className="inline-block whitespace-nowrap">
              {word.split("").map((ch) => {
                const i = index++;
                return (
                  <motion.span
                    key={i}
                    className="inline-block"
                    style={colors ? { color: colors[i % colors.length] } : undefined}
                    initial={reduce ? false : { y: 36, opacity: 0, rotate: -10 }}
                    animate={
                      fontsReady || reduce
                        ? { y: 0, opacity: 1, rotate: 0 }
                        : { y: 36, opacity: 0, rotate: -10 }
                    }
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 15,
                      delay: delay + i * 0.04,
                    }}
                    whileHover={
                      reduce
                        ? undefined
                        : {
                            y: -8,
                            rotate: i % 2 ? 8 : -8,
                            transition: { type: "spring", stiffness: 500, damping: 10 },
                          }
                    }
                  >
                    {ch}
                  </motion.span>
                );
              })}
            </span>
            {w < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </span>
    </span>
  );
};

/** Endless horizontal ribbon. Children are rendered twice for a seamless loop. */
export const Marquee: React.FC<{
  children: React.ReactNode;
  className?: string;
  slow?: boolean;
}> = ({ children, className = "", slow }) => (
  <div className={`pause-on-hover overflow-hidden ${className}`}>
    <div
      className={`flex w-max ${slow ? "animate-marquee-slow" : "animate-marquee"}`}
    >
      <div className="flex shrink-0 items-center">{children}</div>
      <div className="flex shrink-0 items-center" aria-hidden>
        {children}
      </div>
    </div>
  </div>
);

/** Static wrapper that gives a sticker its resting tilt. Content is always
 *  visible: nothing waits on scroll position to appear. */
export const PopIn: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  rotate?: number;
}> = ({ children, className, rotate = 0 }) => (
  <div
    className={className}
    style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
  >
    {children}
  </div>
);
