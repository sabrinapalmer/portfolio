# sabrinapalmer.com

Portfolio site (React + Vite + Tailwind), deployed on Vercel from `master`.

## Pages

| Path | What it is | Source |
| --- | --- | --- |
| `/` | Home: intro, main nav, quick links | `src/pages/Home.tsx` |
| `/experience` | Work history | `src/pages/Experience.tsx` |
| `/projects` | Websites, apps, tools and games, grouped by type | `src/pages/Projects.tsx` |
| `/art` | Film photography gallery and booking links | `src/pages/Art.tsx` |
| `/contact` | Contact form (EmailJS) | `src/pages/Contact.tsx` |
| `/portraits` | SMP Photography: beach, family and dog sessions | `public/portraits.html` |
| `/listings` | SMP Photography: Airbnb and real estate photos | `public/listings.html` |
| `/musicanalyst` | Music Analyst (Spotify export dashboard) | `public/musicanalyst.html` |
| `/networth` | Net Worth Ledger | `public/networth/index.html` |
| `/workout` | Workout planner | `public/workout/index.html` |
| `/map` | Redirects to brinamaps.com | `vercel.json` |

BrinaMaps lives in `brinamaps/` and `ios-app/` and deploys as its own Vercel project at brinamaps.com.

## Adding a page or link

- New standalone page: put it in `public/`, add a rewrite in `vercel.json`, give it a `← sabrinapalmer.com` link back to `/`.
- List it on `/projects`: add an entry to the `projects` array in `src/pages/Projects.tsx` (`type`: `web`, `apps`, `tools` or `games`).
- Home quick links: `src/config/links.ts`.

## Develop

```
npm ci
npm run dev
npm run build
```
