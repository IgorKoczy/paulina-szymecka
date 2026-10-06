/* Szablon Atelier: ruch strony.
   Krzywe (Emil Kowalski): out .23,1,.32,1 · inout .77,0,.175,1 · drawer .32,.72,0,1.
   Zasady: tylko transform/opacity/clip-path; wejścia jednorazowe; sterowanie szybkie (100 do 250 ms); efekty skali plakatu tylko w hero, soczewce i taśmie;
   ograniczenie ruchu = statyczna strona z łagodnymi zanikami; Lenis tylko dla myszy; zawsze działa bez JS (treść widoczna). */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const barEl = $('[data-bar]');

  /* ======================= formularz wiadomości (bez GSAP) ======================= */
  function initComposer() {
    const form = $('[data-composer]'); if (!form) return;
    const msgEl = $('[data-msg]', form), chips = $$('input[type=checkbox]', form);
    const sms = $('[data-ch=sms]', form), ig = $('[data-ch=ig]', form), fb = $('[data-ch=fb]', form), copyBtn = $('[data-copy]', form);
    const tel = sms.getAttribute('href').replace('sms:', '');
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    let toast = $('.toast'); if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast); }
    let tt;
    const say = t => { toast.textContent = t; toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 2600); };
    const message = () => {
      const picked = chips.filter(c => c.checked).map(c => c.value.toLowerCase());
      if (!picked.length) return form.dataset.empty;
      return `${form.dataset.prefix} ${picked.join(', ')}. ${form.dataset.suffix}`;
    };
    const update = () => { const m = message(); msgEl.textContent = m; sms.setAttribute('href', `sms:${tel}${ios ? '&' : '?'}body=${encodeURIComponent(m)}`); };
    const copy = async () => { try { await navigator.clipboard.writeText(message()); say('Wiadomość skopiowana. Wklej ją w rozmowie.'); } catch (e) { say('Zaznacz i skopiuj wiadomość ręcznie.'); } };
    chips.forEach(c => c.addEventListener('change', update));
    [ig, fb].forEach(a => a.addEventListener('click', copy));
    copyBtn.addEventListener('click', copy);
    $$('[data-pick]').forEach(a => a.addEventListener('click', () => {
      const opt = $(`[data-opt="${a.dataset.pick}"]`, form); if (opt) { opt.checked = true; update(); }
    }));
    update();
  }
  initComposer();

  /* ======================= tryb awaryjny / ograniczony ruch ======================= */
  const hasLibs = window.gsap && window.ScrollTrigger && window.SplitText && window.CustomEase;
  if (!hasLibs) { root.classList.add('fx-fail'); barEl && barEl.classList.add('is-solid'); initMenuBasic(); return; }
  if (reduce) { root.classList.add('fx-reduce'); barEl && barEl.classList.add('is-solid'); initMenuBasic(); initQuotes(true); return; }

  function initMenuBasic() {
    const btn = $('.bar__menu'), menu = $('#menu'); if (!btn || !menu) return;
    const set = v => { btn.setAttribute('aria-expanded', String(v)); menu.hidden = !v; menu.style.clipPath = v ? 'none' : ''; menu.setAttribute('aria-hidden', String(!v)); };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach(a => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }

  /* ======================= GSAP: start po fontach ======================= */
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create('out', '.23,1,.32,1');
  CustomEase.create('inout', '.77,0,.175,1');
  CustomEase.create('drawer', '.32,.72,0,1');
  ScrollTrigger.config({ ignoreMobileResize: true });

  let lenis = null, vel = 0, lastY = scrollY, menuOpen = false;

  function start() {
    if (root.classList.contains('fx')) return;
    initScroll();
    const heroTl = initHero();
    initBar();
    initMenu();
    initReveals();
    initManifest();
    initLens();
    initMarquees();
    initQuotes(false);
    initAnchors();
    initFooter();
    addEventListener('load', () => ScrollTrigger.refresh());
    window.__site = { lenis, ScrollTrigger, heroTl, get vel() { return vel; } };
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
  setTimeout(start, 2600); // gdyby fonty się spóźniały

  /* ----------------------- przewijanie ----------------------- */
  function initScroll() {
    if (fine && window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.on('scroll', ScrollTrigger.update);
    }
    gsap.ticker.add((_, dtMs) => {
      const y = scrollY, dt = Math.max(dtMs, 1) / 1000;
      vel += ((y - lastY) / dt - vel) * 0.12; lastY = y;
    });
  }

  /* ----------------------- hero: wejście, mrugnięcie, paralaksa ----------------------- */
  function maskPad(split) { (split.masks || []).forEach(m => { m.style.paddingBlock = '.26em'; m.style.marginBlock = '-.26em'; }); }

  function initHero() {
    const hero = $('[data-hero]'); if (!hero) return null;
    const word = $('.hero__word', hero), script = $('[data-hero-script]', hero), ring = $('[data-ring-hero]', hero);
    const lidT = $('.ring__lid--t', ring), lidB = $('.ring__lid--b', ring), photoImg = $('.ring__photo > img', ring), ins = $$('[data-hero-in]', hero);
    const split = SplitText.create(word, { type: 'chars', mask: 'chars', charsClass: 'ch', aria: 'none' });
    maskPad(split);
    gsap.set(split.chars, { yPercent: 112 });
    gsap.set(ring, { autoAlpha: 0, scale: 0.86 });
    gsap.set(lidT, { yPercent: 10 }); gsap.set(lidB, { yPercent: -10 });
    gsap.set(script, { clipPath: 'inset(-34% 100% -34% -8%)' });
    gsap.set(ins, { y: 14 });
    root.classList.add('fx');
    barEl.style.transition = 'none';
    gsap.set(barEl, { yPercent: -100 });
    const tl = gsap.timeline({ defaults: { ease: 'out' }, delay: 0.1, onComplete() { gsap.set(barEl, { clearProps: 'transform' }); barEl.style.transition = ''; barEl.classList.add('is-ready'); } });
    tl.to(barEl, { yPercent: 0, duration: 0.9 }, 0)
      .to(split.chars, { yPercent: 0, duration: 1.3, stagger: 0.07 }, 0.1)
      .to(ring, { autoAlpha: 1, scale: 1, duration: 1.5 }, 0.25)
      .fromTo(photoImg, { scale: 1.2 }, { scale: 1.04, duration: 2.4 }, 0.25)
      .to(lidT, { yPercent: -101, duration: 1.15 }, 1.0)
      .to(lidB, { yPercent: 101, duration: 1.15 }, 1.0)
      .to(script, { clipPath: 'inset(-34% -8% -34% -8%)', duration: 1.5, ease: 'inout' }, 1.05)
      .to(ins, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 }, 1.05);

    // paralaksa od kursora (tylko mysz): napis w jedną stronę, pierścień i zdjęcie w drugą
    if (fine) {
      const qTitle = gsap.quickTo(word, 'x', { duration: 0.9, ease: 'out' });
      const qRing = gsap.quickTo(ring, 'x', { duration: 1.1, ease: 'out' });
      const qImg = gsap.quickTo(photoImg, 'x', { duration: 1.3, ease: 'out' });
      const qImgY = gsap.quickTo(photoImg, 'y', { duration: 1.3, ease: 'out' });
      const qScript = gsap.quickTo(script, 'x', { duration: 1.0, ease: 'out' });
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        qTitle(nx * -38); qRing(nx * 12); qImg(nx * 26); qImgY(ny * 18); qScript(nx * 30);
      });
    }
    // paralaksa od przewijania: napis wolniej niż pierścień
    gsap.to($('.hero__title', hero), { yPercent: -16, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to(ring, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    return tl;
  }

  /* ----------------------- pasek: motyw, chowanie ----------------------- */
  function initBar() {
    if (!barEl) return;
    const set = theme => barEl.classList.toggle('is-bone', theme === 'bone' || theme === 'greige');
    $$('[data-theme]').forEach(sec => ScrollTrigger.create({
      trigger: sec, start: 'top 42px', end: 'bottom 42px',
      onToggle: self => { if (self.isActive && !menuOpen) set(sec.dataset.theme); }
    }));
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: self => { barEl.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 520 && !menuOpen); }
    });
  }

  /* ----------------------- menu pełnoekranowe ----------------------- */
  function initMenu() {
    const btn = $('.bar__menu'), menu = $('#menu'); if (!btn || !menu) return;
    const spans = $$('.menu__links span', menu);
    const main = $('#tresc');
    const toggle = force => {
      const v = typeof force === 'boolean' ? force : !menuOpen;
      if (v === menuOpen) return;
      menuOpen = v;
      btn.setAttribute('aria-expanded', String(v)); btn.setAttribute('aria-label', v ? 'Zamknij menu' : 'Otwórz menu');
      menu.setAttribute('aria-hidden', String(!v));
      if (main) main.inert = v;
      if (v) {
        barEl.classList.remove('is-bone', 'is-hidden');
        menu.hidden = false; lenis && lenis.stop();
        gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.6, ease: 'drawer', overwrite: true });
        gsap.fromTo(spans, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: 'out', stagger: 0.05, delay: 0.14, overwrite: true });
        spans[0] && spans[0].parentElement.focus({ preventScroll: true });
      } else {
        gsap.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.38, ease: 'drawer', overwrite: true, onComplete() { menu.hidden = true; } });
        lenis && lenis.start();
        ScrollTrigger.update();
        btn.focus({ preventScroll: true });
      }
    };
    btn.addEventListener('click', () => toggle());
    addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
    $$('a', menu).forEach(a => a.addEventListener('click', () => toggle(false)));
    menu.__toggle = toggle;
  }

  /* ----------------------- kotwice (płynne dojście) ----------------------- */
  function initAnchors() {
    const off = () => (barEl ? barEl.offsetHeight : 72) + 8;
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const t = $(id); if (!t) return;
      e.preventDefault();
      const y = t.getBoundingClientRect().top + scrollY - (id === '#glowna' ? 0 : off() * 0);
      if (lenis) lenis.scrollTo(t, { offset: id === '#glowna' ? 0 : -8, duration: 1.5, easing: x => 1 - Math.pow(1 - x, 4) });
      else window.scrollTo({ top: y, behavior: 'smooth' });
    });
  }

  /* ----------------------- odsłony ----------------------- */
  function initReveals() {
    // linie nagłówków: maska z zapasem na polskie znaki
    $$('[data-in-lines]').forEach(el => {
      SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'ln', aria: 'none', autoSplit: true,
        onSplit(self) {
          maskPad(self);
          return gsap.from(self.lines, { yPercent: 110, duration: 1.1, ease: 'out', stagger: 0.09, scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
        }
      });
    });
    root.classList.add('fx');
    // zwykłe elementy: jednorazowo, z krótkim staggerem
    const ins = $$('[data-in]');
    gsap.set(ins, { y: 16 });
    ScrollTrigger.batch(ins, {
      start: 'top 90%', once: true,
      onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 0.85, ease: 'out', stagger: 0.07, overwrite: true })
    });
    // pismo odręczne: odsłona jak pisanie (od lewej do prawej)
    $$('[data-write]').forEach(el => {
      gsap.fromTo(el, { clipPath: 'inset(-34% 100% -34% -8%)' }, { clipPath: 'inset(-34% -8% -34% -8%)', duration: 1.6, ease: 'inout', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    // grupy cennika i wiersze osi czasu (przejścia CSS, kolejno)
    $$('.price').forEach(g => $$('.prow', g).forEach((r, i) => r.style.setProperty('--i', i)));
    ScrollTrigger.batch('.price', { start: 'top 88%', once: true, onEnter: els => els.forEach((e, i) => setTimeout(() => e.classList.add('is-in'), i * 140)) });
    ScrollTrigger.batch('.timeline__row', { start: 'top 90%', once: true, onEnter: els => els.forEach((e, i) => setTimeout(() => e.classList.add('is-in'), i * 160)) });
    // ramki zdjęć: odsłona maską (wnętrze) + kontur wsuwa się za nią + oddech obrazu
    $$('[data-frame]').forEach(f => {
      const inner = $('.frame__in', f) || f, im = $('img', f); if (!im) return;
      ScrollTrigger.create({ trigger: f, start: 'top 90%', once: true, onEnter: () => f.classList.add('is-in') });
      gsap.fromTo(inner, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.25, ease: 'inout', scrollTrigger: { trigger: f, start: 'top 90%', once: true } });
      gsap.fromTo(im, { scale: 1.22 }, { scale: 1.04, duration: 1.8, ease: 'out', scrollTrigger: { trigger: f, start: 'top 90%', once: true } });
      gsap.fromTo(im, { yPercent: -3 }, { yPercent: 3, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ----------------------- manifest: zdania słowo po słowie ----------------------- */
  function initManifest() {
    const el = $('[data-words]'); if (!el) return;
    const sp = SplitText.create(el, { type: 'words', wordsClass: 'w', aria: 'auto' });
    gsap.fromTo(sp.words, { opacity: 0.14 }, { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: true } });
  }

  /* ----------------------- soczewka: pin + mrugnięcie ----------------------- */
  function blink(ring, swap) {
    const t = $('.ring__lid--t', ring), b = $('.ring__lid--b', ring);
    return gsap.timeline()
      .to(t, { yPercent: 10, duration: 0.2, ease: 'inout' }, 0)
      .to(b, { yPercent: -10, duration: 0.2, ease: 'inout' }, 0)
      .add(swap, '>')
      .to(t, { yPercent: -101, duration: 0.36, ease: 'out' }, '>+0.05')
      .to(b, { yPercent: 101, duration: 0.36, ease: 'out' }, '<');
  }

  function initLens() {
    const sec = $('[data-lens]'); if (!sec) return;
    const pin = $('[data-lens-pin]', sec), ring = $('[data-lens-ring]', sec);
    const items = $$('.look-item', sec), imgs = $$('.lens__img', sec), btns = $$('.look', sec);
    const N = items.length; let active = 0, busy = false, queued = null, st = null;
    gsap.set($('.ring__lid--t', ring), { yPercent: -101 }); gsap.set($('.ring__lid--b', ring), { yPercent: 101 });
    const apply = i => {
      items.forEach((it, k) => { it.classList.toggle('is-active', k === i); $('.look', it).setAttribute('aria-pressed', String(k === i)); });
      imgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
      active = i;
    };
    const go = i => {
      if (i === active) return;
      if (busy) { queued = i; return; }
      busy = true;
      blink(ring, () => apply(i)).eventCallback('onComplete', () => {
        busy = false;
        if (queued !== null && queued !== active) { const q = queued; queued = null; go(q); } else queued = null;
      });
    };
    sec.classList.add('is-lens');
    const mm = gsap.matchMedia();
    mm.add({ desk: '(min-width: 901px)', mob: '(max-width: 900px)' }, ctx => {
      const per = ctx.conditions.desk ? 0.72 : 0.56;
      st = ScrollTrigger.create({
        trigger: sec, start: 'top top', end: () => '+=' + Math.round(innerHeight * N * per), pin, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: self => {
          const x = self.progress * N, target = Math.min(N - 1, Math.max(0, Math.floor(x)));
          if (target !== active && (x < active - 0.07 || x > active + 1.07)) go(target);
        }
      });
      return () => { st && st.kill(); };
    });
    btns.forEach((b, i) => b.addEventListener('click', () => {
      if (!st) return go(i);
      const y = st.start + ((i + 0.5) / N) * (st.end - st.start);
      if (lenis) lenis.scrollTo(y, { duration: 1.3, easing: x => 1 - Math.pow(1 - x, 4) }); else window.scrollTo({ top: y, behavior: 'smooth' });
    }));
    // paralaksa od kursora wewnątrz pierścienia
    if (fine) {
      const wrap = $('.ring__photo', ring);
      const qx = gsap.quickTo(wrap, 'x', { duration: 1.1, ease: 'out' }), qy = gsap.quickTo(wrap, 'y', { duration: 1.1, ease: 'out' });
      pin.addEventListener('pointermove', e => {
        const r = pin.getBoundingClientRect(); qx(((e.clientX - r.left) / r.width - 0.5) * 14); qy(((e.clientY - r.top) / r.height - 0.5) * 10);
      });
    }
  }

  /* ----------------------- taśma: ruch ciągły + przyspieszenie od przewijania ----------------------- */
  function initMarquees() {
    $$('[data-marq]').forEach(el => {
      const track = $('.marq__track', el), dir = +el.dataset.dir || -1, base = 36;
      let x = 0, w = 0, vis = false;
      const measure = () => { w = track.scrollWidth / 2; };
      measure(); if (dir > 0) x = -w * 0.5; addEventListener('resize', measure); document.fonts && document.fonts.ready.then(() => { measure(); });
      ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: s => { vis = s.isActive; } });
      gsap.ticker.add((_, dtMs) => {
        if (!vis || !w) return;
        const boost = Math.max(-900, Math.min(900, vel)) * 0.22;
        x += dir * (base + boost) * (dtMs / 1000);
        if (x <= -w) x += w; if (x > 0) x -= w;
        track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      });
    });
  }

  /* ----------------------- opinie: wolna zmiana cytatu ----------------------- */
  function initQuotes(staticMode) {
    const list = $('[data-quotes]'); if (!list || staticMode) return;
    const qs = $$('.quote', list); if (qs.length < 2) return;
    let i = 0, timer = null, vis = false, hold = false;
    const show = k => { qs.forEach((q, n) => q.classList.toggle('is-active', n === k)); i = k; };
    const tick = () => { if (vis && !hold) show((i + 1) % qs.length); };
    timer = setInterval(tick, 7500);
    ScrollTrigger.create({ trigger: list, start: 'top 90%', end: 'bottom 10%', onToggle: s => { vis = s.isActive; } });
    list.addEventListener('pointerenter', () => { hold = true; }); list.addEventListener('pointerleave', () => { hold = false; });
    list.addEventListener('focusin', () => { hold = true; }); list.addEventListener('focusout', () => { hold = false; });
  }

  /* ----------------------- stopka: odbicie osiada ----------------------- */
  function initFooter() {
    const echo = $('.foot__word .echo i'); if (!echo) return;
    gsap.fromTo(echo, { yPercent: 6, opacity: 0.15 }, { yPercent: 46, opacity: 0.5, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top 90%', end: 'bottom bottom', scrub: true } });
  }
})();
