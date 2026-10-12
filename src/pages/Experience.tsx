import React from "react";
import PageHeader from "../components/ui/PageHeader";
import { employers, talks } from "../data/experience";

const Experience: React.FC = () => (
  <div className="page">
    <PageHeader
      title="Experience"
      intro="Splunk, 2018 to 2024: sales engineering first, then data analytics and data engineering for the sales engineering organization."
    />

    {employers.map((employer) => (
      <section
        key={employer.company}
        className="grid gap-8 border-t border-line pt-10 md:grid-cols-[14rem_1fr] md:gap-12"
      >
        <div>
          <h2 className="section-title">{employer.company}</h2>
          <p className="mt-1 text-muted">
            {employer.roles[employer.roles.length - 1].start} –{" "}
            {employer.roles[0].end}
          </p>
          <p className="mt-4 text-[15px] text-muted">{employer.summary}</p>
        </div>

        <div>
          <ol className="relative border-l border-line">
            {employer.roles.map((role, i) => (
              <li key={role.title} className="relative pb-10 pl-7 last:pb-0">
                <span
                  aria-hidden
                  className={`absolute -left-[5px] top-2 h-[9px] w-[9px] rounded-full ${
                    i === 0 ? "bg-plum" : "border border-muted bg-paper"
                  }`}
                />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <h3 className="text-xl font-semibold">{role.title}</h3>
                  <p className="text-[15px] text-muted sm:shrink-0">
                    {role.start} – {role.end}
                  </p>
                </div>
                <p className="text-[15px] text-muted">
                  {[role.team, role.location].filter(Boolean).join(", ")}
                </p>
                <ul className="mt-3 max-w-prose list-disc space-y-1.5 pl-5 marker:text-line">
                  {role.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <h3 className="text-base font-semibold">Tools and skills</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {employer.skills.map((s) => (
                <li key={s} className="tag">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    ))}

    <section className="mt-20 grid gap-8 border-t border-line pt-10 md:grid-cols-[14rem_1fr] md:gap-12">
      <h2 className="section-title">Talks and conference projects</h2>
      <ul className="divide-y divide-line">
        {talks.map((t) => (
          <li key={t.title} className="py-6 first:pt-0">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <h3 className="text-xl font-semibold">{t.title}</h3>
              <p className="text-[15px] text-muted sm:shrink-0">{t.year}</p>
            </div>
            <p className="text-[15px] text-muted">{t.venue}</p>
            <p className="mt-2 max-w-prose">{t.description}</p>
            {t.skills && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {t.skills.map((s) => (
                  <li key={s} className="tag">
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  </div>
);

export default Experience;
