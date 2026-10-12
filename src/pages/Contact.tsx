import React, { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import PageHeader from "../components/ui/PageHeader";
import { links } from "../config/navigation";

interface FormState {
  name: string;
  email: string;
  message: string;
}

type Status = "idle" | "sending" | "sent" | "error";

const field =
  "mt-1.5 block w-full rounded border border-line bg-white px-3.5 py-2.5 text-ink placeholder:text-muted/70 focus:border-plum focus:outline-none focus:ring-2 focus:ring-plum/20";

const Contact: React.FC = () => {
  const [form, setForm] = useState<FormState>({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");

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
        title="Contact"
        intro="For projects, collaborations, or access to one of my apps, send a message here or email me directly."
      />

      <div className="grid gap-12 md:grid-cols-[14rem_1fr] md:gap-12">
        <dl className="space-y-6">
          <div>
            <dt className="text-sm text-muted">Email</dt>
            <dd>
              <a className="link break-all" href={`mailto:${links.email}`}>
                {links.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">GitHub</dt>
            <dd>
              <a
                className="link"
                href={links.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                sabrinapalmer
              </a>
            </dd>
          </div>
        </dl>

        <form onSubmit={onSubmit} className="max-w-xl space-y-5">
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
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded bg-plum px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-plum-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send message"}
            </button>
            <p role="status" className="text-[15px]">
              {status === "sent" && (
                <span className="text-emerald-700">
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
