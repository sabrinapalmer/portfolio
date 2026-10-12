import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Letters spring in one by one, and each one wobbles when hovered. */
export const BouncyText: React.FC<{
  text: string;
  className?: string;
  delay?: number;
}> = ({ text, className, delay = 0 }) => {
  const reduce = useReducedMotion();
  return (
    <span className={className} aria-label={text} role="text">
      {text.split("").map((ch, i) =>
        ch === " " ? (
          <span key={i} aria-hidden> </span>
        ) : (
          <motion.span
            key={i}
            aria-hidden
            className="inline-block"
            initial={reduce ? false : { y: 40, opacity: 0, rotate: -12 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 14,
              delay: delay + i * 0.045,
            }}
            whileHover={
              reduce ? undefined : { y: -10, rotate: i % 2 ? 8 : -8, scale: 1.08 }
            }
          >
            {ch}
          </motion.span>
        )
      )}
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

/** Pops in when scrolled into view. Use once per group, not on every element. */
export const PopIn: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  rotate?: number;
}> = ({ children, className, delay = 0, rotate = 0 }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 30, scale: 0.94, rotate: rotate * 2 }}
      whileInView={{ opacity: 1, y: 0, scale: 1, rotate }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay }}
    >
      {children}
    </motion.div>
  );
};
