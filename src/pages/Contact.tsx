import React, { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import PageHeader from "../components/ui/PageHeader";
import Doodle, { Flower } from "../components/ui/Doodle";
import { links } from "../config/navigation";

interface FormState {
  name: string;
  email: string;
  message: string;
}

type Status = "idle" | "sending" | "sent" | "error";

const field =
  "mt-1.5 block w-full rounded-2xl border-2 border-ink bg-white px-4 py-3 text-ink shadow-sticker transition-shadow focus:shadow-[4px_4px_0_0_#FF5FA8] focus:outline-none";

const confettiColors = ["#7C4DFF", "#FF5FA8", "#FF9A3C", "#FFD43B", "#2FD0A0", "#4DB8FF"];

const Confetti: React.FC = () => {
  const pieces = Array.from({ length: 36 }, (_, i) => {
    const angle = (i / 36) * Math.PI * 2;
    const dist = 90 + (i % 5) * 28;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 40,
      r: (i * 47) % 360,
      c: confettiColors[i % confettiColors.length],
      round: i % 3 === 0,
    };
  });
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className={`absolute block h-2.5 w-2.5 border border-ink ${p.round ? "rounded-full" : ""}`}
          style={{ background: p.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.4 }}
          animate={{ x: p.x, y: p.y + 120, opacity: 0, rotate: p.r, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.2, 0.7, 0.4, 1] }}
        />
      ))}
    </div>
  );
};

const Contact: React.FC = () => {
  const [form, setForm] = useState<FormState>({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");
  const reduce = useReducedMotion();

  useEffect(() => {
    emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
  }, []);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      if (
        !import.meta.env.VITE_EMAILJS_SERVICE_ID ||
        !import.meta.env.VITE_EMAILJS_TEMPLATE_ID
      ) {
        throw new Error("Missing EmailJS configuration");
      }
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name: form.name,
          from_email: form.email,
          message: form.message,
          to_name: import.meta.env.VITE_RECIPIENT_NAME || "Recipient",
        }
      );
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      console.error("Error sending email:", err);
      setStatus("error");
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Say hi"
        color="#4DB8FF"
        intro="For projects, collaborations, or access to one of my apps, send a message here or email me directly."
        art={<Flower className="h-28 w-28" fill="#4DB8FF" />}
      />

      <div className="grid gap-12 md:grid-cols-[18rem_1fr] md:gap-14">
        <div className="space-y-5">
          <a
            href={`mailto:${links.email}`}
            className="sticker block -rotate-1 bg-butter p-5 transition-transform hover:rotate-0"
          >
            <span className="text-sm font-semibold">Email</span>
            <span className="block break-all font-display text-xl font-bold">{links.email}</span>
          </a>
          <a
            href={links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="sticker block rotate-1 bg-mint-soft p-5 transition-transform hover:rotate-0"
          >
            <span className="text-sm font-semibold">GitHub</span>
            <span className="block font-display text-xl font-bold">sabrinapalmer</span>
          </a>
          <Doodle name="sparkle" className="mx-auto hidden h-24 w-24 animate-bob md:block" />
        </div>

        <form onSubmit={onSubmit} className="sticker max-w-2xl space-y-5 bg-sky-soft p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-[15px] font-medium">
              Name
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={form.name}
                onChange={onChange}
                className={field}
                required
              />
            </label>
            <label className="block text-[15px] font-medium">
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={form.email}
                onChange={onChange}
                className={field}
                required
              />
            </label>
          </div>
          <label className="block text-[15px] font-medium">
            Message
            <textarea
              name="message"
              rows={6}
              value={form.message}
              onChange={onChange}
              className={field}
              required
            />
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <AnimatePresence>{status === "sent" && !reduce && <Confetti />}</AnimatePresence>
            <button
              type="submit"
              disabled={status === "sending"}
              className="btn bg-gum disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send message"}
            </button>
            </div>
            <p role="status" className="text-[15px]">
              {status === "sent" && (
                <span className="font-semibold text-emerald-700">
                  Message sent. I'll reply by email.
                </span>
              )}
              {status === "error" && (
                <span className="text-red-700">
                  The message didn't send. Email me at {links.email} instead.
                </span>
              )}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Contact;
