# MSM Entertainment — motion & visual redesign

## Run

```bash
npm install        # optional: exact pinned versions are already vendored in assets/vendor/
npm start          # http://localhost:4173
```

`server.mjs` is dependency-free. It serves the static site and proxies
`/api/brand-enquiries` and `/api/creator-applications` to the live MSM API, so
the existing form validation, payloads and endpoints are unchanged. On a real
host, map those two paths to the same upstream with a reverse proxy.

---

## STEP 0 — Audit of the previous build (before changes)

Source: live `https://msm-e.com` (Vinext/React SSR). The local `MSM/` folder was
empty, so the live bundle was fetched and inspected: `index-BytBGB_b.css`,
`page-DQ6KkXjJ.js` (bundled GSAP + ScrollTrigger), plus `/updates`, `/privacy`,
`/terms`.

**How sections transitioned**
- Native `html { scroll-behavior: smooth }` plus plain hash links. No Lenis, no
  custom `scrollTo`, no active-nav state and no numbered indicator.
- Intro overlay (`MSM ENTERTAINMENT`) played on **every** page load: ~1.35s in,
  0.68s out, 0.7s overlay fade — about 3.5s total, not skippable and not
  session-scoped. It locked `body { overflow: hidden }`.
- Reveals used GSAP `from()` + ScrollTrigger (`once: true`) at `top 87–83%`;
  hero/case parallax used `scrub` (hero `yPercent: 12`, case images
  `-5 → 5` with scale). No clip-path, no pinned/stacked sections, no magnetic
  buttons, no counters, no custom cursor, no hover-fill contact links.

**Animation approach**
- GSAP 3.x + ScrollTrigger bundled into the page chunk; `gsap.matchMedia()`
  handled `prefers-reduced-motion`; `gsap.context()` with `scope` and `revert()`
  was already in place.
- Both marquees were pure CSS `@keyframes` translating `-50%` over 24s/28s —
  constant speed but no velocity reaction and no pause-on-hover.
- Mobile menu used a `transform: translateY(-110%)` transition; nav had no
  hide-on-scroll behaviour.

**Jank / risk findings**
- `.service-card::before` animated **`inset` from `100% 0 0` to `0`** on hover
  — a layout/paint property, not transform. Replaced with `translate3d`.
- `.service-card` and `.button` animated `background-color`/`color` (cheap but
  kept to short durations); `.creator-image img` animated `filter: grayscale()`
  on hover (paint-heavy, retained only because the effect is intentional).
- No throttled scroll listeners existed (ScrollTrigger owned scroll), which was
  good; the new build keeps that property by using Lenis + ScrollTrigger only.
- Case-study images were hotlinked from `images.unsplash.com` and
  `amanoramall.com`; creator/founder images were served as full-size JPEGs.
  **No `width`/`height` attributes** on any `<img>` → CLS risk. The 805 KB
  favicon was also unnecessarily large.
- `--font-geist-sans` / `--font-geist-mono` were referenced but never defined in
  the shipped CSS, so the site silently fell back to Arial/monospace.
- `will-change` was set permanently on `.intro-mark`, `.hero-wordmark` and
  `.hero-line > span`, even when idle.

**Previous design tokens**
- `--ink:#0a0a0a`, `--paper:#f2f0eb`, `--white:#fff`,
  `--line-light:#ffffff2e`, `--line-dark:#00000038`.
- Fonts: undefined Geist variables → Arial + system mono. Type used ad-hoc
  `clamp()` values; spacing was a loose 0.25rem Tailwind scale, not an 8px grid.

---

## STEP 1–3 — What changed

- **Scroll:** Lenis 1.3.28 (`lerp 0.09`) on fine-pointer devices only, driven by
  `gsap.ticker`; all in-page links use `lenis.scrollTo(..., 1.2s, easeInOutExpo)`
  with nav-height offset. Active nav item + 01–09 rail update via ScrollTrigger.
- **Transitions:** reveal elements fade/translate on enter; each section gets a
  scrubbed clip-path/transform reveal; About → Services → Creators use sticky
  background layers that scale to 0.96 / fade to 0.5 while the next slides up.
- **Intro:** ~1.2s wordmark + line-by-line hero reveal, skippable via button or
  Escape, played once per session (`sessionStorage`).
- **Micro-interactions:** magnetic CTAs, scroll indicator fade, service stagger +
  glow + arrow motion + cursor spotlight, creator clip-path wipe + ±8% parallax
  + hover zoom + counter-roll, work word-by-word reveal + parallax, stat
  count-ups, velocity-reactive marquees with hover pause, floating-label forms
  with animated success, desktop dot/ring cursor with “View” state, hide/show nav,
  full-screen clip-path mobile curtain.
- **Visual system:** Clash Display + Satoshi self-hosted (`font-display: swap`,
  preloaded), 8px spacing grid, fluid `clamp()` type scale, one accent
  (`#d9ff45`), film grain, hero/contact gradient glows, hairline dividers,
  hover-fill contact links.
- **Images:** every homepage image self-hosted as AVIF + WebP at 720/1440w with
  `srcset`/`sizes`, intrinsic `width`/`height`, `loading="lazy"` and
  `decoding="async"`. Favicon reduced from 805 KB to ~16 KB.
- **Routes/copy:** all copy, IDs, links, form names/placeholders/options and SEO
  meta preserved. `/updates` (+ 4 articles), `/privacy` and `/terms` are kept as
  static pages with their original content and self-hosted update imagery.

---

## STEP 4 — Pinned versions

| Package | Version | Local file | CDN equivalent |
|---|---|---|---|
| gsap | **3.15.1** | `assets/vendor/gsap.min.js` | `https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js` |
| ScrollTrigger | **3.15.1** | `assets/vendor/ScrollTrigger.min.js` | `https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/ScrollTrigger.min.js` |
| lenis | **1.3.28** | `assets/vendor/lenis.min.js` | `https://cdn.jsdelivr.net/npm/lenis@1.3.28/dist/lenis.min.js` |

`npm i gsap@3.15.1 lenis@1.3.28` installs the same versions.

Reduced motion: Lenis, parallax, marquees, magnetic motion, cursor and the intro
are all disabled; reveals fall back to opacity-only fades.

---

## Source vs. served builds

`assets/css/site.css` and `assets/js/site.js` are the fully commented source
files. The page serves `site.min.css` / `site.min.js` (built with `csso-cli` and
`terser@5.44.0`). After editing a source, rebuild with:

```bash
npx csso-cli assets/css/site.css -o assets/css/site.min.css
npx terser@5.44.0 assets/js/site.js -c -m -o assets/js/site.min.js
```

## Tunable constants

Everything is in the `CONFIG` object at the top of `assets/js/site.js`:
`lenis.lerp`, `lenis.scrollDuration`, intro durations/stagger, reveal duration/y,
section clip/scrub, stack scale/opacity/range, hero parallax, creator parallax,
work word stagger, stats duration, marquee speeds/velocity/skew/settle, magnetic
strength, cursor lag, nav hide threshold and ease names.

---

## Test checklist

- [ ] Desktop Chrome: intro plays once, skip works, hero lines land cleanly.
- [ ] Desktop: nav glides to every `#id`, active number matches section, nav
      hides down / returns up, backdrop blur visible.
- [ ] Desktop: hover service cards (no layout jump), creators (counter-roll),
      case studies (“View” cursor), contact links (fill).
- [ ] Both marquees: seamless, pause on hover, skew/speed with fast scroll.
- [ ] Forms: browser validation fires; successful POST shows the original
      success copy; failed POST alerts and re-enables the button.
- [ ] `/updates`, all 4 article routes, `/privacy`, `/terms` load directly.
- [ ] `/updates`: mobile clip-path menu opens and links navigate back to `/#id`.
- [ ] No horizontal overflow at 390px (`documentElement.scrollWidth === 390`).
- [ ] iPhone Safari: no Lenis, native momentum, mobile clip-path menu, no CLS.
- [ ] Android Chrome: touch scrolling native, images load via AVIF/WebP.
- [ ] `prefers-reduced-motion: reduce`: no intro/marquee/parallax, content visible.
- [ ] Keyboard: skip link, focus rings, Escape closes menu/intro.
- [x] CLS = 0, LCP ≈ 1.5–1.8 s, FCP ≈ 1.1–1.6 s, Accessibility 100,
      Best Practices 100, SEO 100 (Lighthouse 12.8.2, mobile emulation).
- [ ] Lighthouse mobile Performance ≥ 90 — **not yet met on this local dev VM**.
      Measured 71–82 across runs (high variance from shared CPU); TBT is the
      limiting metric (0.7–2.2 s under 4× CPU throttling). The remaining work
      is JS long-task reduction: ship GSAP/ScrollTrigger/Lenis only to fine
      pointers and use IntersectionObserver + CSS reveals on touch.
      Re-measure on a production build behind a CDN before sign-off.
