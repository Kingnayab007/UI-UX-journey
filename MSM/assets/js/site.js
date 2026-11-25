/* ==========================================================================
   MSM Entertainment — motion layer
   --------------------------------------------------------------------------
   All feel settings live in CONFIG below. Nothing here animates layout
   properties: transforms, opacity and clip-path only. GSAP work is scoped in
   gsap.context() and every listener is removed on pagehide.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * 3. TUNABLE CONSTANTS — change the feel here, not below.
   * ------------------------------------------------------------------ */
  function easeInOutExpo(t) {
    if (t === 0 || t === 1) return t;
    return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  }

  var CONFIG = {
    sessionKey: 'msm:intro:played',

    lenis: {
      lerp: 0.09,             // requested 0.08–0.1
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      scrollDuration: 1.2     // anchor glide
    },

    intro: {
      wordmarkIn: 0.34,
      wordmarkOut: 0.22,
      shellIn: 0.26,
      headline: 0.7,
      headlineStagger: 0.07,
      supportStagger: 0.06,
      hold: 0.05
    },

    reveal: {
      duration: 0.9,
      y: 44,
      stagger: 0.08,
      start: 'top 86%',
      reducedDuration: 0.4
    },

    section: {
      y: 24,
      clipInset: '5% 0 0 0',
      start: 'top 94%',
      end: 'top 48%',
      scrub: 0.6
    },

    stack: {
      scaleOut: 0.96,
      opacityOut: 0.5,
      yIn: 10,
      rangeVh: 0.9
    },

    hero: {
      parallaxY: 12,
      scrollFadeEnd: '25% top'
    },

    creators: {
      parallax: 8,            // ±8% inside the frame
      revealDuration: 1,
      stagger: 0.09,
      countDuration: 1.1
    },

    work: {
      parallax: 7,
      wordDuration: 0.8,
      wordStagger: 0.055
    },

    stats: { duration: 1.6 },

    marquee: {
      tickerDuration: 24,
      brandsDuration: 28,
      velocityFactor: 1 / 900,
      maxTimeScale: 2.4,
      skewMax: 6,
      settle: 0.45
    },

    magnetic: { strength: 0.18, duration: 0.5 },

    cursor: { dotLag: 0.12, ringLag: 0.38 },

    nav: { hideAfter: 180 },

    ease: {
      out: 'power3.out',
      expoOut: 'expo.out',
      inOut: 'power2.inOut'
    }
  };

  /* ------------------------------------------------------------------ *
   * Environment + tiny helpers
   * ------------------------------------------------------------------ */
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
  var coarseMQ = window.matchMedia('(pointer: coarse)');
  var reduced = reduceMQ.matches;
  var finePointer = fineMQ.matches && !coarseMQ.matches && !reduced;
  var cleanups = [];
  var lenis = null;
  var ctx = null;

  function on(el, type, fn, opts) {
    if (!el) return;
    el.addEventListener(type, fn, opts);
    cleanups.push(function () { el.removeEventListener(type, fn, opts); });
  }

  function sessionGet(key) {
    try { return window.sessionStorage.getItem(key); } catch (e) { return null; }
  }
  function sessionSet(key, value) {
    try { window.sessionStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  function navHeight() {
    var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
    return isNaN(v) ? 76 : v;
  }

  function formatCount(el, value) {
    var scale = parseFloat(el.dataset.scale || '1');
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    var pad = parseInt(el.dataset.pad || '0', 10);
    var suffix = el.dataset.suffix || '';
    var n = value / scale;
    var out = decimals ? n.toFixed(decimals) : String(Math.round(n));
    if (pad) out = out.padStart(pad, '0');
    return out + suffix;
  }

  function rollCount(el, duration, fromFactor) {
    var target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    var proxy = { v: target * (fromFactor || 1) };
    if (!gsap || reduced) { el.textContent = formatCount(el, target); return; }
    gsap.to(proxy, {
      v: target,
      duration: duration || CONFIG.stats.duration,
      ease: CONFIG.ease.out,
      onUpdate: function () { el.textContent = formatCount(el, proxy.v); },
      onComplete: function () { el.textContent = formatCount(el, target); }
    });
  }

  /* ------------------------------------------------------------------ *
   * No library / reduced fallback — keep everything readable and usable.
   * ------------------------------------------------------------------ */
  if (!gsap || !ScrollTrigger) {
    var introFallback = document.querySelector('#intro');
    if (introFallback) introFallback.classList.add('is-done');
    document.querySelectorAll('[data-count]').forEach(function (el) {
      el.textContent = formatCount(el, parseFloat(el.dataset.count));
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------------ *
   * Lenis — desktop wheel inertia, synced to GSAP's ticker.
   * Touch devices keep native scrolling; reduced motion skips Lenis.
   * ------------------------------------------------------------------ */
  if (window.Lenis && !reduced && !coarseMQ.matches) {
    lenis = new window.Lenis({
      lerp: CONFIG.lenis.lerp,
      smoothWheel: CONFIG.lenis.smoothWheel,
      wheelMultiplier: CONFIG.lenis.wheelMultiplier,
      touchMultiplier: CONFIG.lenis.touchMultiplier,
      autoRaf: false
    });
    lenis.on('scroll', ScrollTrigger.update);
    var tick = function (time) { lenis.raf(time * 1000); };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    cleanups.push(function () {
      gsap.ticker.remove(tick);
      lenis.destroy();
    });
  }

  function scrollToTarget(target) {
    var offset = -navHeight();
    if (lenis) {
      lenis.scrollTo(target, {
        offset: offset,
        duration: CONFIG.lenis.scrollDuration,
        easing: easeInOutExpo
      });
    } else {
      var top = target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  /* ------------------------------------------------------------------ *
   * Mobile menu (clip-path curtain + staggered links)
   * ------------------------------------------------------------------ */
  var menuBtn = document.querySelector('.menu-button');
  var menu = document.querySelector('.mobile-menu');
  var menuOpen = false;

  function closeMenu(returnFocus) {
    if (!menu || !menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    if (menuBtn) {
      menuBtn.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
      if (returnFocus) menuBtn.focus();
    }
    if (lenis) lenis.start();
    document.body.style.overflow = '';
  }

  function openMenu() {
    if (!menu || menuOpen) return;
    menuOpen = true;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    if (menuBtn) {
      menuBtn.classList.add('is-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.setAttribute('aria-label', 'Close menu');
    }
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';
    if (!reduced) {
      gsap.fromTo(menu.children,
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.05, ease: CONFIG.ease.out, overwrite: true }
      );
    }
    var first = menu.querySelector('a');
    if (first) first.focus({ preventScroll: true });
  }

  on(menuBtn, 'click', function () { menuOpen ? closeMenu(true) : openMenu(); });
  on(document, 'keydown', function (e) { if (e.key === 'Escape') closeMenu(true); });

  /* ------------------------------------------------------------------ *
   * In-page anchors — Lenis glide with easeInOutExpo + active state.
   * ------------------------------------------------------------------ */
  var sectionToIndex = {
    '#home': '01', '#about': '02', '#services': '03', '#creators': '04',
    '#work': '05', '#brands': '07', '#join': '08', '#contact': '09', '#founder': '07'
  };

  function setActiveSection(num) {
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      var isActive = a.getAttribute('data-nav') === num;
      if (isActive) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-rail]').forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-rail') === num);
    });
  }

  on(document, 'click', function (e) {
    var link = e.target.closest && e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.charAt(0) !== '#') return;
    var target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    if (menuOpen) closeMenu(true);
    scrollToTarget(target);
    var num = sectionToIndex[href];
    if (num) setActiveSection(num);
    if (href !== '#main' && window.history && history.replaceState) {
      history.replaceState(null, '', href);
    }
  });

  /* ------------------------------------------------------------------ *
   * Scoped motion context
   * ------------------------------------------------------------------ */
  ctx = gsap.context(function () {

    /* --- page-load intro: wordmark → hero lines, once per session ----- */
    var intro = document.querySelector('#intro');
    if (intro) intro.dataset.ready = '1';
    var skip = document.querySelector('.intro-skip');
    var alreadyPlayed = sessionGet(CONFIG.sessionKey) === '1';

    function finishIntro() {
      if (!intro) return;
      intro.classList.add('is-done');
      gsap.set(intro, { display: 'none' });
      document.documentElement.classList.remove('is-intro');
      ScrollTrigger.refresh();
    }
    if (skip) on(skip, 'click', function () {
      sessionSet(CONFIG.sessionKey, '1');
      if (window.__msmIntro) window.__msmIntro.progress(1);
      finishIntro();
    });
    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && intro && !intro.classList.contains('is-done')) {
        sessionSet(CONFIG.sessionKey, '1');
        if (window.__msmIntro) window.__msmIntro.progress(1);
        finishIntro();
      }
    });

    // Touch devices skip the intro: an opaque full-screen overlay delays LCP
    // and the hero reveal adds little value where there is no hover pointer.
    if (!intro || reduced || alreadyPlayed || coarseMQ.matches) {
      if (intro) intro.classList.add('is-done');
      sessionSet(CONFIG.sessionKey, '1');
      if (intro) gsap.set(intro, { display: 'none' });
    } else {
      sessionSet(CONFIG.sessionKey, '1');
      document.documentElement.classList.add('is-intro');
      var tl = gsap.timeline({ onComplete: finishIntro });
      window.__msmIntro = tl;
      tl.fromTo('.intro-mark',
          { autoAlpha: 0, scale: 0.94 },
          { autoAlpha: 1, scale: 1, duration: CONFIG.intro.wordmarkIn, ease: CONFIG.ease.out })
        .fromTo('.intro-skip', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, '<')
        .to('.intro-mark', { autoAlpha: 0, scale: 1.03, duration: CONFIG.intro.wordmarkOut, ease: CONFIG.ease.inOut }, '+=' + CONFIG.intro.hold)
        .to(intro, { autoAlpha: 0, duration: 0.28, ease: 'none' }, '<')
        .set(intro, { display: 'none' })
        .fromTo('.site-shell', { autoAlpha: 0 }, { autoAlpha: 1, duration: CONFIG.intro.shellIn }, '<')
        .fromTo('.hero-line > span',
          { yPercent: 115 },
          { yPercent: 0, duration: CONFIG.intro.headline, stagger: CONFIG.intro.headlineStagger, ease: 'expo.out' }, '<0.05')
        .fromTo('.hero-kicker, .hero-support, .hero-actions',
          { y: 20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.6, stagger: CONFIG.intro.supportStagger, ease: CONFIG.ease.out }, '<0.25');
    }

    /* --- reveal elements: one trigger per section, not per element ---- */
    gsap.utils.toArray('main > section[id]').forEach(function (sec) {
      var items = sec.querySelectorAll('.reveal');
      if (!items.length) return;
      // opacity (not autoAlpha) keeps headings in the accessibility tree
      // before their reveal fires, so the heading order stays valid.
      if (reduced) {
        gsap.from(items, {
          opacity: 0, duration: CONFIG.reveal.reducedDuration, ease: 'none',
          scrollTrigger: { trigger: sec, start: CONFIG.reveal.start, once: true }
        });
      } else {
        gsap.from(items, {
          y: CONFIG.reveal.y, opacity: 0, stagger: CONFIG.reveal.stagger,
          duration: CONFIG.reveal.duration, ease: CONFIG.ease.out,
          scrollTrigger: { trigger: sec, start: CONFIG.reveal.start, once: true }
        });
      }
    });

    /* --- section-to-section reveals (clip-path / transform only) ------ */
    // Scrubbed clip-path transitions are desktop-only; touch keeps native
    // scrolling and avoids ~10 extra layout-reading ScrollTriggers.
    if (!reduced && !coarseMQ.matches) {
      gsap.utils.toArray('main > section[id]').forEach(function (sec) {
        if (sec.classList.contains('hero')) return;
        var isStack = sec.classList.contains('stack-card');
        gsap.fromTo(sec,
          { y: CONFIG.section.y, clipPath: isStack ? 'none' : 'inset(' + CONFIG.section.clipInset + ')' },
          {
            y: 0, clipPath: isStack ? 'none' : 'inset(0% 0 0 0)',
            ease: 'none',
            scrollTrigger: { trigger: sec, start: CONFIG.section.start, end: CONFIG.section.end, scrub: CONFIG.section.scrub }
          }
        );
      });

      /* stacked-card hand-off: outgoing scales/fades, incoming slides up */
      ['.about', '.services', '.creators'].forEach(function (sel) {
        var sec = document.querySelector(sel);
        var bg = sec && sec.querySelector('.stack-bg');
        if (!sec || !bg) return;
        var range = function () { return '+=' + Math.round(window.innerHeight * CONFIG.stack.rangeVh); };
        gsap.to(bg, {
          scale: CONFIG.stack.scaleOut,
          opacity: CONFIG.stack.opacityOut,
          ease: 'none',
          scrollTrigger: { trigger: sec, start: 'top top', end: range, scrub: true, invalidateOnRefresh: true }
        });
        gsap.fromTo(bg,
          { yPercent: CONFIG.stack.yIn, opacity: 0.55 },
          {
            yPercent: 0, opacity: 1, ease: 'none',
            scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub: true }
          }
        );
      });
    }

    /* --- hero ----------------------------------------------------------- */
    if (!reduced) {
      if (!coarseMQ.matches) {
        gsap.to('.hero-wordmark', {
          yPercent: CONFIG.hero.parallaxY, ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
        });
      }
      gsap.to('.hero-scroll', {
        autoAlpha: 0, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: CONFIG.hero.scrollFadeEnd, scrub: true }
      });
    }

    /* --- services ------------------------------------------------------- */
    if (!reduced) {
      gsap.from('.service-card', {
        y: 55, autoAlpha: 0, stagger: CONFIG.reveal.stagger,
        duration: 0.85, ease: CONFIG.ease.out,
        scrollTrigger: { trigger: '.service-grid', start: 'top 82%', once: true }
      });
    }
    var spotlight = document.querySelector('[data-spotlight]');
    if (spotlight && finePointer && !reduced) {
      var raf = 0, mx = 0, my = 0;
      var move = function (e) {
        var r = spotlight.getBoundingClientRect();
        mx = e.clientX - r.left; my = e.clientY - r.top;
        if (!raf) {
          raf = requestAnimationFrame(function () {
            spotlight.style.setProperty('--mx', mx + 'px');
            spotlight.style.setProperty('--my', my + 'px');
            raf = 0;
          });
        }
      };
      on(spotlight, 'pointermove', move, { passive: true });
      cleanups.push(function () { if (raf) cancelAnimationFrame(raf); });
    }

    /* --- creators: clip-path wipe + inner parallax + count roll -------- */
    gsap.utils.toArray('.creator-card').forEach(function (card) {
      var media = card.querySelector('.creator-media');
      if (!media) return;
      if (reduced) {
        gsap.from(media, { autoAlpha: 0, duration: 0.4, scrollTrigger: { trigger: card, start: 'top 90%', once: true } });
      } else {
        gsap.fromTo(media,
          { clipPath: 'inset(0 100% 0 0)' },
          {
            clipPath: 'inset(0 0% 0 0)', duration: CONFIG.creators.revealDuration, ease: CONFIG.ease.out,
            scrollTrigger: { trigger: card, start: 'top 88%', once: true }
          }
        );
        if (!coarseMQ.matches) {
          gsap.fromTo(media,
            { yPercent: -CONFIG.creators.parallax },
            {
              yPercent: CONFIG.creators.parallax, ease: 'none',
              scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 1 }
            }
          );
        }
      }
      var count = card.querySelector('[data-count]');
      if (!count) return;
      count.setAttribute('aria-label', count.textContent);
      var rolled = false;
      on(card, 'pointerenter', function () {
        if (rolled || reduced) return;
        rolled = true;
        rollCount(count, CONFIG.creators.countDuration, 0.82);
      });
    });

    /* --- selected work: word reveal + image parallax ------------------- */
    gsap.utils.toArray('[data-words]').forEach(function (heading) {
      var text = heading.textContent.trim();
      heading.setAttribute('aria-label', text);
      var frag = document.createDocumentFragment();
      text.split(/\s+/).forEach(function (word, i, arr) {
        var mask = document.createElement('span');
        mask.className = 'word-mask';
        mask.setAttribute('aria-hidden', 'true');
        var inner = document.createElement('span');
        inner.textContent = word;
        mask.appendChild(inner);
        frag.appendChild(mask);
        if (i < arr.length - 1) frag.appendChild(document.createTextNode(' '));
      });
      heading.textContent = '';
      heading.appendChild(frag);
      if (reduced) return;
      gsap.from(heading.querySelectorAll('.word-mask > span'), {
        yPercent: 110, autoAlpha: 0,
        duration: CONFIG.work.wordDuration, stagger: CONFIG.work.wordStagger, ease: CONFIG.ease.out,
        scrollTrigger: { trigger: heading, start: 'top 88%', once: true }
      });
    });

    if (!reduced && !coarseMQ.matches) {
      gsap.utils.toArray('.case-media').forEach(function (media) {
        gsap.fromTo(media,
          { yPercent: -CONFIG.work.parallax },
          {
            yPercent: CONFIG.work.parallax, ease: 'none',
            scrollTrigger: { trigger: media.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1.1 }
          }
        );
      });
    }

    /* --- stat / network count-ups -------------------------------------- */
    gsap.utils.toArray('.stat-row [data-count], .creator-network [data-count]').forEach(function (el) {
      el.setAttribute('aria-label', el.textContent);
      if (reduced) { el.textContent = formatCount(el, parseFloat(el.dataset.count)); return; }
      var proxy = { v: 0 };
      gsap.to(proxy, {
        v: parseFloat(el.dataset.count),
        duration: CONFIG.stats.duration,
        ease: CONFIG.ease.out,
        onUpdate: function () { el.textContent = formatCount(el, proxy.v); },
        onComplete: function () { el.textContent = formatCount(el, parseFloat(el.dataset.count)); },
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    /* --- marquees: constant speed, velocity-reactive, pause on hover --- */
    function initMarquee(root, duration) {
      // On touch, CSS keyframes drive the loop on the compositor. Keeping the
      // GSAP ticker awake for an infinite tween is the largest TBT cost.
      if (!root || reduced || coarseMQ.matches) return;
      var track = root.querySelector('.marquee-track');
      if (!track) return;
      var loop = gsap.to(track, { xPercent: -50, duration: duration, ease: 'none', repeat: -1 });
      on(root, 'mouseenter', function () { loop.pause(); });
      on(root, 'mouseleave', function () { loop.play(); });
      var settleTimer;
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: function (self) {
          var v = Math.abs(self.getVelocity());
          var ts = 1 + Math.min(v * CONFIG.marquee.velocityFactor, CONFIG.marquee.maxTimeScale - 1);
          gsap.to(loop, { timeScale: ts, duration: 0.2, overwrite: true });
          gsap.to(track, {
            skewX: Math.min(v / 220, CONFIG.marquee.skewMax) * (self.direction === 1 ? 1 : -1),
            duration: 0.2, overwrite: 'auto'
          });
          clearTimeout(settleTimer);
          settleTimer = setTimeout(function () {
            gsap.to(loop, { timeScale: 1, duration: 0.5, overwrite: true });
            gsap.to(track, { skewX: 0, duration: 0.5, overwrite: 'auto' });
          }, CONFIG.marquee.settle * 1000);
        }
      });
      cleanups.push(function () { clearTimeout(settleTimer); loop.kill(); });
    }
    initMarquee(document.querySelector('.ticker'), CONFIG.marquee.tickerDuration);
    initMarquee(document.querySelector('.brand-strip'), CONFIG.marquee.brandsDuration);

    /* --- nav hide/show + numbered active indicator --------------------- */
    Object.keys(sectionToIndex).forEach(function (hash) {
      var sec = document.querySelector(hash);
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 55%', end: 'bottom 55%',
        onEnter: function () { setActiveSection(sectionToIndex[hash]); },
        onEnterBack: function () { setActiveSection(sectionToIndex[hash]); }
      });
    });
    var header = document.querySelector('.navbar');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        if (!header) return;
        header.classList.toggle('nav-hidden', self.direction === 1 && self.scroll() > CONFIG.nav.hideAfter);
      }
    });

    /* --- magnetic buttons ---------------------------------------------- */
    if (finePointer && !reduced) {
      gsap.utils.toArray('[data-magnetic]').forEach(function (el) {
        var xTo = gsap.quickTo(el, 'x', { duration: CONFIG.magnetic.duration, ease: CONFIG.ease.out });
        var yTo = gsap.quickTo(el, 'y', { duration: CONFIG.magnetic.duration, ease: CONFIG.ease.out });
        on(el, 'pointermove', function (e) {
          var r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * CONFIG.magnetic.strength);
          yTo((e.clientY - r.top - r.height / 2) * CONFIG.magnetic.strength);
        }, { passive: true });
        on(el, 'pointerleave', function () { xTo(0); yTo(0); });
      });
    }

    /* --- custom cursor (fine pointer only) ----------------------------- */
    if (finePointer) {
      document.body.classList.add('has-cursor');
      var dot = document.querySelector('.cursor-dot');
      var ring = document.querySelector('.cursor-ring');
      if (dot && ring) {
        gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
        gsap.set(ring, { scale: 0.5 });
        var dx = gsap.quickTo(dot, 'x', { duration: CONFIG.cursor.dotLag, ease: 'power3.out' });
        var dy = gsap.quickTo(dot, 'y', { duration: CONFIG.cursor.dotLag, ease: 'power3.out' });
        var rx = gsap.quickTo(ring, 'x', { duration: CONFIG.cursor.ringLag, ease: 'power3.out' });
        var ry = gsap.quickTo(ring, 'y', { duration: CONFIG.cursor.ringLag, ease: 'power3.out' });
        var shown = false;
        on(window, 'pointermove', function (e) {
          dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
          if (!shown) { shown = true; gsap.to([dot, ring], { autoAlpha: 1, duration: 0.2 }); }
          var active = !!e.target.closest('a,button,[role="button"]');
          var view = !!e.target.closest('[data-cursor="view"]');
          ring.classList.toggle('is-active', active);
          ring.classList.toggle('is-view', view);
          gsap.to(ring, { scale: view ? 1 : (active ? 0.72 : 0.5), duration: 0.3, ease: CONFIG.ease.out, overwrite: 'auto' });
        }, { passive: true });
        on(document, 'mouseleave', function () { gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2 }); shown = false; });
      }
    }
  }, document);

  /* ------------------------------------------------------------------ *
   * Forms — native validation retained; endpoints + payloads unchanged.
   * ------------------------------------------------------------------ */
  function initForm(form, endpoint, payload, successText, requireSuccess) {
    if (!form) return;
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');

    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      var wrap = field.closest('.field');
      if (!wrap) return;
      var sync = function () { wrap.classList.toggle('is-filled', !!field.value); };
      on(field, 'input', sync);
      on(field, 'change', sync);
      sync();
    });

    on(form, 'submit', function (e) {
      e.preventDefault();
      if (button) button.disabled = true;
      (async function () {
        var data = new FormData(form);
        var res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload(data))
        });
        var json = await res.json().catch(function () { return {}; });
        if (!res.ok || (requireSuccess && !json.success)) {
          throw new Error(json.error || 'Failed to submit enquiry');
        }
        form.reset();
        form.classList.add('is-success');
        form.querySelectorAll('.field').forEach(function (f) { f.classList.remove('is-filled'); });
        if (status) {
          status.textContent = successText;
          if (gsap && !reduced) {
            gsap.fromTo(status, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: CONFIG.ease.out });
          }
        }
      })().catch(function (error) {
        console.error('MSM form error:', error);
        alert('Something went wrong. Please try again.');
      }).then(function () {
        if (button) button.disabled = false;
      });
    });
  }

  initForm(
    document.querySelector('#brand-form'),
    '/api/brand-enquiries',
    function (d) {
      return {
        company: d.get('company'), email: d.get('email'),
        campaignType: d.get('campaign'), budget: d.get('budget'), brief: d.get('brief')
      };
    },
    'Thank you. Your campaign brief is ready for the MSM team.',
    true
  );

  initForm(
    document.querySelector('#creator-form'),
    '/api/creator-applications',
    function (d) {
      return {
        name: d.get('name'), instagram: d.get('instagram'), followers: d.get('followers'),
        category: d.get('niche'), city: d.get('city'), email: d.get('email'),
        phone: d.get('phone'), portfolio: d.get('portfolio')
      };
    },
    'Application received. Welcome to the next chapter.',
    false
  );

  /* ------------------------------------------------------------------ *
   * Refresh measurements after lazy images settle; full teardown on exit.
   * ------------------------------------------------------------------ */
  on(window, 'load', function () { ScrollTrigger.refresh(); }, { once: true });
  on(window, 'pagehide', function () {
    cleanups.slice().reverse().forEach(function (fn) { fn(); });
    cleanups.length = 0;
    if (ctx) ctx.revert();
  }, { once: true });
})();
