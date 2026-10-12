import React from "react";
import { Link } from "react-router-dom";
import Profile from "../assets/profile.png";
import { artworks } from "../data/artworks";
import { projects } from "../data/projects";
import { employers } from "../data/experience";
import { links } from "../config/navigation";

const stripTitles = [
  "Sticks at Sunset, Moonrise",
  "Smile Tower",
  "Calf and Mother",
  "Baháʼí Temple in Fog",
  "Camel Rock",
  "Griffith Observatory",
];

const Home: React.FC = () => {
  const strip = stripTitles
    .map((t) => artworks.find((a) => a.title === t))
    .filter((a): a is (typeof artworks)[number] => Boolean(a));
  const featured = projects.filter((p) => p.featured);
  const splunk = employers[0];

  return (
    <>
      <section className="page pb-14 pt-14 sm:pb-20 sm:pt-24">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-10">
          <img
            src={Profile}
            alt="Sabrina Palmer"
            width={112}
            height={112}
            className="h-24 w-24 shrink-0 rounded-full bg-plum-wash object-cover object-top sm:h-28 sm:w-28"
          />
          <div className="max-w-3xl">
            <h1 className="font-display text-[2.4rem] font-semibold leading-[1.08] sm:text-6xl">
              I build data tools and web apps, and I shoot on film.
            </h1>
            <p className="mt-6 max-w-prose text-lg text-muted">
              I spent more than five years at Splunk, starting in sales
              engineering and moving into building the pipelines, dashboards,
              and internal apps the sales engineering team relied on. Now I
              build my own apps and enter game jams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/projects"
                className="rounded bg-plum px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-plum-dark"
              >
                See projects
              </Link>
              <a
                href={`mailto:${links.email}`}
                className="rounded border border-line bg-white px-5 py-2.5 text-[15px] font-medium text-ink transition-colors hover:border-ink"
              >
                Email me
              </a>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Film photography" className="film-strip">
        <div className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6">
          {strip.map((art) => (
            <Link
              key={art.title}
              to="/art"
              className="block min-w-[14rem] flex-1 overflow-hidden sm:min-w-[16rem] lg:min-w-0"
              aria-label={`${art.title}, view photography`}
            >
              <img
                src={art.imageUrl}
                alt={art.title}
                loading="lazy"
                className="h-40 w-full object-cover transition-opacity hover:opacity-85 sm:h-48 lg:h-52"
              />
            </Link>
          ))}
        </div>
      </section>
      <div className="page mt-3 flex justify-end">
        <Link to="/art" className="link text-[15px]">
          View all photography
        </Link>
      </div>

      <section className="page mt-20">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="section-title">Recent projects</h2>
          <Link to="/projects" className="link shrink-0 text-[15px]">
            All projects
          </Link>
        </div>
        <ul className="mt-8 grid gap-10 md:grid-cols-3 md:gap-8">
          {featured.map((p) => (
            <li key={p.title} className="border-t-2 border-ink pt-5">
              <h3 className="text-xl font-semibold">{p.title}</h3>
              <p className="mt-2 text-muted">{p.summary}</p>
              <a
                href={p.links[0].url}
                className="link mt-3 inline-block text-[15px]"
                {...(p.links[0].url.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {p.links[0].label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="page mt-20">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="section-title">Experience</h2>
          <Link to="/experience" className="link shrink-0 text-[15px]">
            Full experience
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3 md:gap-8">
          <div>
            <p className="font-display text-xl font-semibold">{splunk.company}</p>
            <p className="text-muted">
              {splunk.roles[splunk.roles.length - 1].start} –{" "}
              {splunk.roles[0].end}
            </p>
          </div>
          <ol className="md:col-span-2">
            {splunk.roles.map((r) => (
              <li
                key={r.title}
                className="flex flex-col justify-between gap-1 border-b border-line py-3 first:pt-0 sm:flex-row sm:gap-6"
              >
                <span>{r.title}</span>
                <span className="text-[15px] text-muted sm:shrink-0">
                  {r.start} – {r.end}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="page mt-24">
        <div className="rounded-lg bg-plum-wash px-6 py-10 sm:px-10">
          <h2 className="section-title">Get in touch</h2>
          <p className="mt-3 max-w-prose text-muted">
            For projects, collaborations, or access to one of my apps, email{" "}
            <a className="link" href={`mailto:${links.email}`}>
              {links.email}
            </a>{" "}
            or use the{" "}
            <Link className="link" to="/contact">
              contact form
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
};

export default Home;
