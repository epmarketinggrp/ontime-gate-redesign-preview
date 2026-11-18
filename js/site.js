/* On Time redesign preview: lightning gate, live logo, moving tools, electric details. No libraries. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  document.documentElement.classList.add('js');

  /* ---- Miami clock and technician hours (hours as published on the site) ---- */
  const clocks = $$('.clock'), shift = $('#shift');
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const tick = () => {
    const p = Object.fromEntries(fmt.formatToParts(new Date()).map(x => [x.type, x.value]));
    const h = +p.hour % 24, txt = `${String(h).padStart(2, '0')}:${p.minute}:${p.second}`;
    clocks.forEach(c => { c.textContent = txt; });
    const d = p.weekday;
    const onShift = (['Sun', 'Mon', 'Tue', 'Wed', 'Thu'].includes(d) && h >= 6 && h < 22) || (d === 'Fri' && h >= 6 && h < 13);
    shift.textContent = onShift ? 'Technicians on shift now' : 'Phones answered 24/7';
  };
  tick(); setInterval(tick, 1000);

  /* ---- small generated details: card tags and brackets, FAQ numbers, city order, footer ticker ---- */
  $$('.card').forEach((c, i) => {
    const im = $('.card-img', c);
    im.insertAdjacentHTML('beforeend', `<i class="brk" aria-hidden="true"></i><span class="tagc mono" aria-hidden="true">SVC·0${i + 1}</span>`);
    im.style.setProperty('--sd', `${-i * 1.3}s`);
  });
  $$('#faq summary').forEach((s, i) => s.insertAdjacentHTML('afterbegin', `<span class="qn mono" aria-hidden="true">Q.0${i + 1}</span>`));
  $$('.line li').forEach((li, i) => li.style.setProperty('--i', i));
  const ftick = $('#ftick');
  $$('span', ftick).forEach(s => ftick.appendChild(s.cloneNode(true)));

  /* ---- FX layer: lightning and sparks on one canvas above the page, current pulses on one behind it ---- */
  const fx = $('#fx'), bg = $('#bg'), hdr = $('#hdr');
  const fxc = fx.getContext('2d'), bgc = bg.getContext('2d');
  let W = 0, H = 0, DPR = 1, fxLive = false;
  const bolts = [], sparks = [], pulses = [];
  const size = () => {
    W = fx.clientWidth || innerWidth; H = fx.clientHeight || innerHeight; DPR = Math.min(devicePixelRatio || 1, 1.5);
    fx.width = W * DPR; fx.height = H * DPR; bg.width = W; bg.height = H;
  };
  const below = () => { const b = Math.max(0, hdr.getBoundingClientRect().bottom); return [0, b, W, H - b]; };   // keep ambient bolts off the header

  const jag = (x1, y1, x2, y2, d, out) => {            // midpoint displacement: a crooked line from 1 to 2
    if (d < 2.5) { out.push([x2, y2]); return out; }
    const mx = (x1 + x2) / 2 + rand(-d, d), my = (y1 + y2) / 2 + rand(-d, d);
    jag(x1, y1, mx, my, d / 2, out); jag(mx, my, x2, y2, d / 2, out);
    return out;
  };
  // a and b are points or functions returning points, so a bolt can follow things that move
  const bolt = (a, b, o = {}) => {
    if (still || bolts.length > 44) return;
    const f = p => (typeof p === 'function' ? p : () => p);
    bolts.push({ a: f(a), b: f(b), born: performance.now(), life: o.life || 260, w: o.w || 1, forks: o.forks ?? 2, d: o.d || .16, clip: o.clip || null, pts: null, kids: [], at: 0 });
  };
  const spark = (x, y, n, o = {}) => {
    if (still) return;
    for (let i = 0; i < n && sparks.length < 280; i++) {
      const an = o.dir == null ? rand(0, 6.283) : o.dir + rand(-(o.spread || .6), o.spread || .6), sp = rand(40, o.max || 320);
      sparks.push({ x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, age: 0, life: rand(.2, o.life || .7), hot: Math.random() < .3 });
    }
  };
  const line = (pts, w, a) => {
    fxc.beginPath(); fxc.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) fxc.lineTo(pts[i][0], pts[i][1]);
    fxc.strokeStyle = '#13a2e7'; fxc.globalAlpha = a * .14; fxc.lineWidth = 18 * w; fxc.stroke();
    fxc.globalAlpha = a * .4; fxc.lineWidth = 7 * w; fxc.stroke();
    fxc.strokeStyle = '#74d2ff'; fxc.globalAlpha = a * .85; fxc.lineWidth = 2.8 * w; fxc.stroke();
    fxc.strokeStyle = '#fff'; fxc.globalAlpha = a; fxc.lineWidth = 1.2 * w; fxc.stroke();
  };
  const drawFx = (now, dt) => {
    if (!bolts.length && !sparks.length) {
      if (fxLive) { fxc.setTransform(1, 0, 0, 1, 0, 0); fxc.clearRect(0, 0, fx.width, fx.height); fxLive = false; }
      return;
    }
    fxLive = true;
    fxc.setTransform(DPR, 0, 0, DPR, 0, 0); fxc.clearRect(0, 0, W, H);
    fxc.globalCompositeOperation = 'lighter'; fxc.lineCap = 'round'; fxc.lineJoin = 'round';
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i], age = now - b.born;
      if (age > b.life) { bolts.splice(i, 1); continue; }
      if (now >= b.at) {                                // a new shape every few frames makes it flicker
        const [x1, y1] = b.a(), [x2, y2] = b.b(), len = Math.hypot(x2 - x1, y2 - y1), dir = Math.atan2(y2 - y1, x2 - x1);
        b.pts = jag(x1, y1, x2, y2, len * b.d, [[x1, y1]]);
        b.kids = [];
        for (let f = 0; f < b.forks; f++) {
          const p = b.pts[Math.floor(rand(.15, .85) * b.pts.length)], an = dir + rand(-1.1, 1.1), l = len * rand(.12, .34);
          b.kids.push(jag(p[0], p[1], p[0] + Math.cos(an) * l, p[1] + Math.sin(an) * l, l * .2, [[p[0], p[1]]]));
        }
        b.at = now + rand(40, 75);
      }
      const a = Math.pow(1 - age / b.life, .7);
      if (b.clip) { const c = b.clip(); fxc.save(); fxc.beginPath(); fxc.rect(c[0], c[1], c[2], c[3]); fxc.clip(); }
      line(b.pts, b.w, a);
      for (const k of b.kids) line(k, b.w * .5, a * .75);
      if (b.clip) fxc.restore();
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.age += dt;
      if (s.age > s.life) { sparks.splice(i, 1); continue; }
      s.vy += 620 * dt; s.vx *= .985;
      const tx = s.x - s.vx * .028, ty = s.y - s.vy * .028;
      s.x += s.vx * dt; s.y += s.vy * dt;
      fxc.globalAlpha = 1 - s.age / s.life; fxc.strokeStyle = s.hot ? '#fff' : '#74d2ff'; fxc.lineWidth = s.hot ? 1.8 : 1.2;
      fxc.beginPath(); fxc.moveTo(tx, ty); fxc.lineTo(s.x, s.y); fxc.stroke();
    }
    fxc.globalAlpha = 1; fxc.globalCompositeOperation = 'source-over';
  };

  const G = 88;                                         // same pitch as the page grid, so pulses ride its lines
  const seed = p => {
    p.h = Math.random() < .55;
    p.line = Math.round(rand(0, (p.h ? H : W) / G)) * G + .5;
    p.dir = Math.random() < .5 ? 1 : -1; p.len = rand(70, 190); p.sp = rand(150, 460);
    p.pos = p.dir > 0 ? -p.len : (p.h ? W : H) + p.len;
    return p;
  };
  const drawBg = dt => {
    bgc.clearRect(0, 0, W, H);
    for (const p of pulses) {
      p.pos += p.dir * p.sp * dt;
      const span = p.h ? W : H;
      if (p.pos < -p.len - 10 || p.pos > span + p.len + 10) { seed(p); continue; }
      const tail = p.pos - p.dir * p.len;
      const g = p.h ? bgc.createLinearGradient(tail, 0, p.pos, 0) : bgc.createLinearGradient(0, tail, 0, p.pos);
      g.addColorStop(0, 'rgba(19,162,231,0)'); g.addColorStop(1, 'rgba(116,210,255,.95)');
      bgc.strokeStyle = g; bgc.lineWidth = 1.4; bgc.beginPath();
      if (p.h) { bgc.moveTo(tail, p.line); bgc.lineTo(p.pos, p.line); } else { bgc.moveTo(p.line, tail); bgc.lineTo(p.line, p.pos); }
      bgc.stroke();
      bgc.fillStyle = '#dff4ff'; bgc.beginPath(); bgc.arc(p.h ? p.pos : p.line, p.h ? p.line : p.pos, 1.7, 0, 6.283); bgc.fill();
    }
  };
  size();
  if (!still) for (let i = 0, n = W < 700 ? 7 : 14; i < n; i++) { const p = seed({}); p.pos = rand(0, p.h ? W : H); pulses.push(p); }

  /* ---- the gate: charge, lightning strike, blown open ---- */
  const gate = $('#gate'), gateBtn = $('#gateBtn'), gateTxt = $('#gateBtnTxt'), gateState = $('#gateState');
  const leafL = $('.leaf.l', gate), leafR = $('.leaf.r', gate), flash = $('#flash');
  const big = $('#gateLogo'), hdrLogo = $('#hdrLogo');
  let moveTimer, busy = false;
  flash.addEventListener('animationend', () => flash.classList.remove('go'));
  const seam = () => { const r = gate.getBoundingClientRect(); return { r, x: r.left + r.width / 2, top: Math.max(r.top, 0), bot: Math.min(r.bottom, H) }; };
  const setGate = (open, label) => {
    gate.classList.toggle('is-open', open);
    gate.classList.remove('granted');
    gate.classList.add('moving');
    gateState.textContent = label || (open ? 'OPENING' : 'CLOSING');
    gateBtn.setAttribute('aria-pressed', String(open));
    gateTxt.textContent = open ? 'Close the gate' : 'Open the gate';
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
      gate.classList.remove('moving'); gateState.textContent = open ? 'OPEN' : 'LOCKED'; busy = false;
      if (!open) {                                      // the leaves meet: a clunk of sparks
        const s = seam();
        spark(s.x, (s.top + s.bot) / 2, 26, { max: 300 });
        spark(s.x, s.bot - 4, 14, { dir: -Math.PI / 2, spread: 1.3, max: 260 });
        bolt([s.x, s.top], [s.x, s.bot], { life: 200, w: .7, forks: 1, d: .05 });
      }
    }, still ? 0 : open ? 1500 : 1700);
  };
  const strike = () => {
    const s = seam(), cy = (s.top + s.bot) / 2;
    bolt([s.x + rand(-280, 280), -30], [s.x, cy], { life: 460, w: 2, forks: 4 });
    bolt([s.x + rand(-140, 140), -30], [s.x + rand(-8, 8), rand(s.top, cy)], { life: 340, w: 1.2, forks: 3 });
    bolt([s.x, s.top], [s.x, s.bot], { life: 560, w: 1.3, forks: 5, d: .07 });
    bolt([s.x, cy], [s.x - s.r.width * rand(.2, .42), cy + rand(-80, 80)], { life: 300, w: .9, forks: 2 });
    bolt([s.x, cy], [s.x + s.r.width * rand(.2, .42), cy + rand(-80, 80)], { life: 300, w: .9, forks: 2 });
    spark(s.x, cy, 80, { max: 680, life: 1.1 });
    spark(s.x, s.bot - 6, 30, { dir: -Math.PI / 2, spread: 1.2, max: 520, life: .9 });
    flash.style.setProperty('--fx', `${s.x}px`); flash.style.setProperty('--fy', `${cy}px`);
    for (const [el, c] of [[flash, 'go'], [gate, 'shake'], [gate, 'zap'], [big, 'hit']]) { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); }
  };
  const thunderOpen = () => {
    if (still) return setGate(true);
    busy = true; gate.classList.add('charge'); gateState.textContent = 'CHARGING';
    const crackle = setInterval(() => {                 // current gathering along the seam
      const s = seam(), y = rand(s.top + 10, s.bot - 10);
      bolt([s.x + rand(-10, 10), y], [s.x + rand(-70, 70), y + rand(-90, 90)], { life: 150, w: .55, forks: 1 });
      spark(s.x, y, 3, { max: 180, life: .4 });
    }, 70);
    setTimeout(() => {
      clearInterval(crackle); gate.classList.remove('charge'); gate.classList.add('granted');
      strike();
      setTimeout(() => {
        setGate(true, 'ACCESS GRANTED');
        let n = 0;
        const arcs = setInterval(() => {                // current still jumping between the leaves as they part
          if (++n > 7) return clearInterval(arcs);
          const s = seam(), y = rand(s.top + 20, s.bot - 20);
          bolt(() => [leafL.getBoundingClientRect().right, y], () => [leafR.getBoundingClientRect().left, y + rand(-30, 30)], { life: 170, w: .7, forks: 1 });
        }, 75);
      }, 110);
    }, 430);
  };
  gateBtn.addEventListener('click', () => {
    if (busy) return;
    if (gate.classList.contains('is-open')) { busy = true; setGate(false); } else thunderOpen();
  });
  const flyLogo = () => {                               // the big logo on the gate flies up into the header
    const a = big.getBoundingClientRect(), b = hdrLogo.getBoundingClientRect();
    const done = () => { big.remove(); hdrLogo.style.visibility = ''; };
    setTimeout(done, 1900);                             // safety net if the animation never reports back
    if (!big.animate || b.width === 0) return done();
    big.animate([{ transform: 'none' }, { transform: `translate(${b.left - a.left}px,${b.top - a.top}px) scale(${b.width / a.width})` }],
      { duration: 1000, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).onfinish = () => {
      done();
      const r = hdrLogo.getBoundingClientRect();
      spark(r.left + r.width / 2, r.top + r.height / 2, 18, { max: 240, life: .5 });
    };
  };
  if (!still) {
    // arrive at a locked gate carrying the logo; lightning hits it, the gate blows open, the logo goes to the header
    gate.classList.add('boot'); gate.classList.remove('is-open');
    gateState.textContent = 'LOCKED'; gateTxt.textContent = 'Open the gate'; gateBtn.setAttribute('aria-pressed', 'false');
    big.classList.add('show'); hdrLogo.style.visibility = 'hidden';
    void gate.offsetWidth; gate.classList.remove('boot');
    let started = false;
    const start = () => { if (started) return; started = true; thunderOpen(); setTimeout(flyLogo, 720); };
    const bigImg = $('img', big);
    if (bigImg.complete) setTimeout(start, 150);
    else { bigImg.addEventListener('load', () => setTimeout(start, 100), { once: true }); setTimeout(start, 900); }
  }

  /* ---- header menu, scroll progress, current section ---- */
  const burger = $('#burger'), nav = $('#nav'), links = $$('a', nav);
  burger.addEventListener('click', () => burger.setAttribute('aria-expanded', String(nav.classList.toggle('open'))));
  nav.addEventListener('click', e => { if (e.target.tagName === 'A') { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
  const spy = [['#services', 1], ['#why', 2], ['#areas', 3], ['#faq', 4]].map(([s, i]) => [$(s), i]);

  /* ---- estimate form: this preview sends nothing ---- */
  const quote = $('#quote'), fields = $$('input,textarea', quote);
  quote.addEventListener('submit', e => {
    e.preventDefault();
    $('#quoteNote').textContent = 'This is a design preview, so the form is switched off. Call (786) 946-5181 for a free onsite estimate.';
  });
  quote.addEventListener('input', () => quote.style.setProperty('--fill', fields.filter(f => f.value.trim()).length / fields.length));

  /* ---- brands marquee: duplicate the row so it loops ---- */
  const marq = $('#marq');
  $$('span', marq).forEach(s => { const c = s.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.firstElementChild.alt = ''; marq.appendChild(c); });

  /* ---- typed line under the hero text (phrases are the site's own) ---- */
  const typed = $('#typed'), PHRASES = ['same-day repair', 'free onsite estimates', 'every job under warranty', 'available 24/7'];
  if (!still) {
    let pi = 0, ci = PHRASES[0].length, del = true;
    const type = () => {
      const p = PHRASES[pi]; ci += del ? -1 : 1; typed.textContent = p.slice(0, ci);
      let wait = del ? 26 : 55;
      if (!del && ci === p.length) { del = true; wait = 1800; } else if (del && ci === 0) { del = false; pi = (pi + 1) % PHRASES.length; wait = 280; }
      setTimeout(type, wait);
    };
    setTimeout(type, 3200);
  }

  /* ---- labels decode from random characters when they come into view ---- */
  const GLYPHS = '01<>/[]{}#%$&=+*ABCDEFXYZ';
  const scramble = el => {
    const txt = el.textContent;
    if (still || el.children.length || !txt.trim() || el.dataset.busy) return;
    el.dataset.busy = '1';
    const t0 = performance.now(), dur = Math.min(900, 260 + txt.length * 22);
    const step = now => {
      const k = Math.max(0, (now - t0) / dur);          // a frame can carry a timestamp from just before t0
      if (k >= 1) { el.textContent = txt; delete el.dataset.busy; return; }
      const n = Math.floor(k * txt.length);
      let s = txt.slice(0, n);
      for (let i = n; i < txt.length; i++) s += txt[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = s; requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const countUp = el => {
    const n = +el.dataset.count, t0 = performance.now();
    const up = now => { const k = clamp((now - t0) / 900, 0, 1); el.textContent = Math.round(n * k); if (k < 1) requestAnimationFrame(up); };
    requestAnimationFrame(up);
  };

  /* ---- things that wait for the viewport (content starts visible if this never runs) ---- */
  let waiting = [];
  const reveal = () => { waiting = waiting.filter(([el, fn]) => { if (el.getBoundingClientRect().top < innerHeight * .94) { fn(el); return false; } return true; }); };
  if (!still) {
    $$('.rv').forEach((el, i) => {
      if (el.getBoundingClientRect().top > innerHeight * .94) { el.classList.add('pre'); el.style.transitionDelay = `${(i % 3) * 60}ms`; waiting.push([el, e => e.classList.remove('pre')]); }
    });
    $$('.eyebrow,.brands-t,.line-n,.line-s,.orbit-hint,.quote-head .mono,.tagc,.qn,.ftr-b>.mono').forEach(el => waiting.push([el, scramble]));
    $$('[data-count]').forEach(el => waiting.push([el, countUp]));
  }
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    hdr.style.setProperty('--sp', max > 0 ? (scrollY / max).toFixed(4) : 0);
    let cur = 0;
    for (const [el, i] of spy) if (el.getBoundingClientRect().top < innerHeight * .4) cur = i;
    links.forEach((a, i) => a.classList.toggle('act', i === cur));
    reveal();
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- card tilt ---- */
  if (fine && !still) $$('.card').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - .5) * 5}deg`);
      c.style.setProperty('--rx', `${(.5 - (e.clientY - r.top) / r.height) * 5}deg`);
    });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });

  /* ---- pointer: cursor ring, spark trail, a small discharge on every press, arcs on buttons ---- */
  const ptr = { x: -9999, y: -9999 };
  const cur = $('#cursor'); let cx = 0, cy = 0, lpx = 0, lpy = 0;
  addEventListener('pointermove', e => {
    ptr.x = e.clientX; ptr.y = e.clientY;
    if (!fine) return;
    cur.classList.add('on');
    if (Math.hypot(e.clientX - lpx, e.clientY - lpy) > 16 && Math.random() < .45) spark(e.clientX, e.clientY, 1, { max: 80, life: .35 });
    lpx = e.clientX; lpy = e.clientY;
  }, { passive: true });
  addEventListener('pointerdown', e => {
    const x = e.clientX, y = e.clientY;
    spark(x, y, 12, { max: 260, life: .5 });
    for (let i = 0; i < 3; i++) { const a = rand(0, 6.283), l = rand(26, 60); bolt([x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l], { life: 160, w: .5, forks: 0 }); }
  }, { passive: true });
  if (fine) {
    document.addEventListener('pointerover', e => cur.classList.toggle('hot', !!e.target.closest('a,button,summary,.orbit,input,textarea')));
    $$('.btn,.remote').forEach(b => b.addEventListener('pointerenter', () => {
      const r = b.getBoundingClientRect();
      bolt([r.left, r.top], [r.right, r.top], { life: 220, w: .5, forks: 0, d: .03 });
      bolt([r.right, r.bottom], [r.left, r.bottom], { life: 220, w: .5, forks: 0, d: .03 });
      spark(r.right, r.top, 5, { max: 160, life: .4 });
    }));
  }

  /* ---- floating tools: drift with scroll, lean away from the pointer, gears keep turning ---- */
  const tools = $$('.ft').map(el => ({
    el, sec: el.closest('section'), s: +el.dataset.s, r: +el.dataset.r, ox: 0, oy: 0, bx: 0, by: 0, seed: Math.random() * 6.28,
    spin: +el.dataset.spin || ($('use', el).getAttribute('href') === '#t-gear' ? 16 : 0),
  }));
  const baseTools = () => tools.forEach(k => {           // where each tool rests inside its section
    k.el.style.transform = 'none';
    const r = k.el.getBoundingClientRect(), s = k.sec.getBoundingClientRect();
    k.bx = r.left + r.width / 2 - s.left; k.by = r.top + r.height / 2 - s.top;
  });
  const toolSecs = [...new Set(tools.map(k => k.sec))], secRect = new Map();
  let scopeOn = false;
  const layout = () => { size(); baseTools(); scopeOn = !!$('#scope').offsetParent; };
  layout();
  addEventListener('resize', () => { layout(); reveal(); });

  /* ---- orbit: the logo with tools and electrons circling it; drag to spin ---- */
  const orbit = $('#orbit'), coreLogo = $('#core .live-logo');
  const ring = el => ({ el, ring: +el.dataset.ring, ph: +el.dataset.ph, x: 0, y: 0 });
  const orbs = $$('.orb', orbit).map(ring), elecs = $$('.elec', orbit).map(ring);
  const RX = [.31, .42, .5], SPEED = [1, -.7, .5];
  let ang = 0, vel = .3, drag = null, ow = 0, oh = 0;
  const measure = () => { ow = orbit.clientWidth; oh = orbit.clientHeight; };
  measure(); new ResizeObserver(measure).observe(orbit);
  orbit.addEventListener('pointerdown', e => { drag = { x: e.clientX }; orbit.setPointerCapture(e.pointerId); });
  orbit.addEventListener('pointermove', e => { if (!drag) return; vel += (e.clientX - drag.x) * .012; vel = clamp(vel, -9, 9); drag.x = e.clientX; });
  ['pointerup', 'pointercancel'].forEach(t => orbit.addEventListener(t, () => { drag = null; }));
  const placeOrbs = () => {
    orbs.forEach(o => {
      const a = ang * SPEED[o.ring] + o.ph, c = Math.cos(a), s = Math.sin(a), rx = RX[o.ring] * ow;
      const depth = (s + 1) / 2;
      o.x = ow / 2 + rx * c; o.y = oh / 2 + rx * .42 * s;
      o.el.style.transform = `translate(${o.x}px,${o.y}px) scale(${.72 + depth * .42})`;
      o.el.style.zIndex = s > 0 ? 3 : 1;
      o.el.style.opacity = .5 + depth * .5;
    });
    elecs.forEach(o => {
      const a = ang * SPEED[o.ring] * 3.4 + o.ph, s = Math.sin(a), rx = RX[o.ring] * ow;
      o.el.style.transform = `translate(${ow / 2 + rx * Math.cos(a)}px,${oh / 2 + rx * .42 * s}px)`;
      o.el.style.zIndex = s > 0 ? 3 : 1;
    });
  };
  placeOrbs();

  /* ---- process rail: the little gate rides it and throws sparks while it moves ---- */
  const steps = $('#steps'), stepEls = $$('.step', steps), car = $('.car', steps);
  let lastP = -1;
  const rail = () => {
    const r = steps.getBoundingClientRect();
    const p = clamp((innerHeight * .82 - r.top) / (innerHeight * .5), 0, 1);
    steps.style.setProperty('--p', p.toFixed(3));
    stepEls.forEach((el, i) => el.classList.toggle('on', p >= (i + .35) / 4));
    if (lastP >= 0 && Math.abs(p - lastP) > .003) {
      const c = car.getBoundingClientRect();
      if (c.width) spark(c.left + c.width / 2, c.bottom, 2, { dir: Math.PI / 2, spread: 1, max: 150, life: .4 });
    }
    lastP = p;
  };

  /* ---- waveform in the gate status chip ---- */
  const scope = $('#scope'), sc = scope.getContext('2d');
  const drawScope = t => {
    if (!scopeOn) return;
    const w = scope.width, h = scope.height, amp = gate.classList.contains('charge') || gate.classList.contains('moving') ? 1 : .42;
    sc.clearRect(0, 0, w, h); sc.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const y = h / 2 + (Math.sin(x * .09 + t * 5) * .5 + Math.sin(x * .23 - t * 8) * .3 + (Math.random() - .5) * .25) * h * .5 * amp;
      if (x) sc.lineTo(x, y); else sc.moveTo(x, y);
    }
    sc.strokeStyle = '#74d2ff'; sc.lineWidth = 1.4; sc.stroke();
  };

  /* ---- one loop for everything that moves ---- */
  const fin = $('.final');
  let last = performance.now(), nextArc = 0, nextStorm = 0;
  const frame = now => {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const vh = innerHeight, t = now / 1000;
    cx += (ptr.x - cx) * .2; cy += (ptr.y - cy) * .2;
    if (fine) cur.style.transform = `translate(${cx}px,${cy}px)`;

    for (const s of toolSecs) secRect.set(s, s.getBoundingClientRect());   // read every position first, then write
    const or = orbit.getBoundingClientRect(), fr = fin.getBoundingClientRect();
    for (const k of tools) {
      const r = secRect.get(k.sec);
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const p = (vh - r.top) / (vh + r.height) - .5;
      const ex = r.left + k.bx, ey = r.top + k.by + p * k.s;
      const dx = ex - ptr.x, dy = ey - ptr.y, d = Math.hypot(dx, dy);
      const push = d < 220 ? (1 - d / 220) * 60 : 0;
      k.ox += ((d ? dx / d : 0) * push - k.ox) * .08; k.oy += ((d ? dy / d : 0) * push - k.oy) * .08;
      k.el.style.transform = `translate(${k.ox}px,${p * k.s + k.oy + Math.sin(t * .8 + k.seed) * 8}px) rotate(${p * k.r + Math.sin(t * .5 + k.seed) * 6 + t * k.spin}deg)`;
    }

    if (or.bottom > 0 && or.top < vh) {
      vel += (.3 - vel) * (drag ? 0 : dt * .9);
      ang += vel * dt;
      placeOrbs();
      const px = fine ? ((ptr.x - (or.left + or.width / 2)) / or.width) : 0, py = fine ? ((ptr.y - (or.top + or.height / 2)) / or.height) : 0;
      coreLogo.style.transform = `rotateY(${Math.sin(t * .7) * 22 + clamp(px, -1, 1) * 14 + vel * 3}deg) rotateX(${clamp(py, -1, 1) * -10}deg)`;
      if (now > nextArc) {                              // the logo throws an arc to one of its tools
        nextArc = now + rand(700, 2000);
        const o = orbs[(Math.random() * orbs.length) | 0];
        bolt(() => { const r = orbit.getBoundingClientRect(); return [r.left + ow / 2, r.top + oh / 2]; },
          () => { const r = orbit.getBoundingClientRect(); return [r.left + o.x, r.top + o.y]; }, { life: 230, w: .7, forks: 1, d: .12, clip: below });
        o.el.classList.add('hit'); setTimeout(() => o.el.classList.remove('hit'), 320);
      }
    }

    if (fr.bottom > 80 && fr.top < vh - 80 && now > nextStorm) {   // a storm either side of the last call to action
      nextStorm = now + rand(1300, 3200);
      const x = fr.left + fr.width * (Math.random() < .5 ? rand(.05, .26) : rand(.74, .95));
      bolt([x + rand(-90, 90), fr.top], [x, fr.top + fr.height * rand(.55, .95)], { life: 320, w: 1, forks: 3, clip: below });
      fin.classList.add('lit'); setTimeout(() => fin.classList.remove('lit'), 160);
    }

    rail(); drawScope(t); drawBg(dt); drawFx(now, dt);
    requestAnimationFrame(frame);
  };
  if (still) { steps.style.setProperty('--p', 1); stepEls.forEach(el => el.classList.add('on')); }
  else requestAnimationFrame(frame);
})();
