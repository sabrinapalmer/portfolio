import React from "react";
import PageHeader from "../components/ui/PageHeader";
import { PopIn } from "../components/ui/Motion";
import Doodle from "../components/ui/Doodle";
import { employers, talks } from "../data/experience";

const roleColors = ["bg-gum", "bg-butter", "bg-mint", "bg-sky"];
const talkColors = ["bg-sky-soft", "bg-tang-soft", "bg-grape-soft"];

const Experience: React.FC = () => (
  <div className="page">
    <PageHeader
      title="Experience"
      color="#FFD43B"
      intro="Splunk, 2018 to 2024: sales engineering first, then data analytics and data engineering for the sales engineering organization."
      art={<Doodle name="chart" className="h-36 w-36" />}
    />

    {employers.map((employer) => (
      <section key={employer.company} className="grid gap-10 lg:grid-cols-[17rem_1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="sticker bg-butter p-6">
            <h2 className="text-4xl font-extrabold">{employer.company}</h2>
            <p className="mt-1 font-semibold">
              {employer.roles[employer.roles.length - 1].start} –{" "}
              {employer.roles[0].end}
            </p>
            <p className="mt-3 text-[15px]">{employer.summary}</p>
          </div>
          <div className="mt-8">
            <h3 className="text-xl font-bold">Tools and skills</h3>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {employer.skills.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ol className="relative space-y-8 border-l-[3px] border-dashed border-ink/50 pl-8 sm:pl-10">
          {employer.roles.map((role, i) => (
            <li key={role.title} className="relative">
              <span
                aria-hidden
                className={`absolute -left-[45px] top-5 h-6 w-6 rounded-full border-2 border-ink sm:-left-[53px] ${roleColors[i % 4]}`}
              />
              <PopIn>
                <div className="sticker p-6">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <h3 className="text-2xl font-bold">{role.title}</h3>
                    <span className={`w-fit shrink-0 rounded-full border-2 border-ink px-3 py-0.5 text-sm font-bold ${roleColors[i % 4]}`}>
                      {role.start} – {role.end}
                    </span>
                  </div>
                  <p className="mt-1 text-[15px] text-muted">
                    {[role.team, role.location].filter(Boolean).join(", ")}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {role.highlights.map((h) => (
                      <li key={h} className="flex gap-3">
                        <span aria-hidden className="mt-[0.55em] h-2 w-2 shrink-0 rotate-45 bg-gum" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </PopIn>
            </li>
          ))}
        </ol>
      </section>
    ))}

    <section className="mt-24">
      <h2 className="section-title">Talks and conference projects</h2>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {talks.map((t, i) => (
          <PopIn key={t.title} className="h-full">
            <div className={`sticker h-full p-6 ${talkColors[i % 3]}`}>
              <p className="font-semibold text-grape-dark">
                {t.venue}, {t.year}
              </p>
              <h3 className="mt-1 text-2xl font-bold">{t.title}</h3>
              <p className="mt-2">{t.description}</p>
              {t.skills && (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {t.skills.map((s) => (
                    <li key={s} className="chip">
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </PopIn>
        ))}
      </div>
    </section>
  </div>
);

export default Experience;
