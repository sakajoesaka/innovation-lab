/* ============================================================
   Natural Sciences Innovation Lab
   Content lives in data/projects.json — edit that, not this file.
   ============================================================ */

const CELL_W = 34, CELL_H = 30;

const POOLS = [
  { col: 'var(--bio)',   s: ['A', 'T', 'C', 'G', 'U'] },
  { col: 'var(--chem)',  s: ['H\u2082O', 'O\u2082', 'CO', 'Fe', 'Mg', 'Na', 'Cl'] },
  { col: 'var(--phys)',  s: ['c', '\u0127', '\u03BB', '\u03BD', '\u03A9', '\u03BC', '\u03B3'] },
  { col: 'var(--math)',  s: ['\u222B', '\u2211', '\u03C0', '\u2202', '\u221A', '\u221E', '\u03B8'] },
  { col: 'var(--earth)', s: ['Si', 'Ca', 'Al', 'K', 'S'] }
];

const TAGCLASS = {
  Biology: 't-bio', Chemistry: 't-chem', Physics: 't-phys',
  Maths: 't-math', 'Earth Science': 't-earth'
};

const ACCENTS = ['var(--bio)', 'var(--chem)', 'var(--phys)', 'var(--math)', 'var(--earth)'];

const pick = a => a[(Math.random() * a.length) | 0];
const pad  = n => String(n).padStart(2, '0');
const esc = str => String(str).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

const field   = document.getElementById('field');
const hero    = document.getElementById('hero');
const panel   = document.getElementById('panel');
const trigger = document.getElementById('trigger');
const markEl  = document.querySelector('.mark');
const homeEl  = document.getElementById('home');
const pageEl  = document.getElementById('page');
const homeBody = document.querySelector('.home-body');
const slidesEl = document.getElementById('slides');
const tlEl     = document.getElementById('tl');

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarse = window.matchMedia('(pointer: coarse)');

/* ---------- content, loaded from JSON ---------- */
let YEARS = [];
let GALLERY = {};
let SLIDES = [];
let TIMELINE = [];

async function loadContent() {
  const res = await fetch('data/projects.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('projects.json ' + res.status);
  const data = await res.json();
  YEARS = data.years.map(y => y.year);
  GALLERY = {};
  for (const y of data.years) GALLERY[y.year] = y.projects;
  SLIDES = data.slides || [];
  TIMELINE = data.timeline || [];
}

/* ---------- character field (landing only) ---------- */
let cells = [], zones = [];

function buildGrid() {
  field.innerHTML = '';
  cells = [];
  const cols = Math.ceil(innerWidth / CELL_W) + 1;
  const rows = Math.ceil(innerHeight / CELL_H) + 1;
  const frag = document.createDocumentFragment();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const el = document.createElement('span');
      el.className = 'c';
      el.style.cssText = `left:${c * CELL_W}px;top:${r * CELL_H}px;width:${CELL_W}px;height:${CELL_H}px`;
      const base = Math.random() < 0.5 ? '0' : '1';
      el.textContent = base;
      frag.appendChild(el);
      cells.push({ el, base, x: c * CELL_W + CELL_W / 2, y: r * CELL_H + CELL_H / 2, on: false, t: null });
    }
  }
  field.appendChild(frag);
  measureZones();
}

/* any UI on screen blocks the reveal, so nothing lights up behind readable text */
function measureZones() {
  zones = [];
  const add = (n, px, py) => {
    if (!n || n.hidden) return;
    const b = n.getBoundingClientRect();
    if (!b.width) return;
    zones.push({ l: b.left - px, r: b.right + px, t: b.top - py, b: b.bottom + py });
  };
  if (document.body.dataset.page === 'home') {
    add(hero, 40, 30);
    add(homeBody, 0, 0);   // solid sections below the hero cover the field
  }
  add(markEl, 14, 14);
  add(trigger, 14, 14);
  if (!panel.hidden) add(panel, 12, 12);
}

function blocked(cell) {
  for (const z of zones) if (cell.x > z.l && cell.x < z.r && cell.y > z.t && cell.y < z.b) return true;
  return false;
}

function reveal(cell, hold) {
  const p = POOLS[(Math.random() * POOLS.length) | 0];
  cell.el.textContent = pick(p.s);
  cell.el.style.color = p.col;
  cell.el.classList.add('on');
  cell.on = true;
  if (cell.t) clearTimeout(cell.t);
  cell.t = setTimeout(() => {
    // fade the symbol out first, then swap the text back once it is invisible
    cell.el.classList.remove('on');
    cell.on = false;
    cell.t = setTimeout(() => {
      cell.el.style.color = '';
      cell.el.textContent = cell.base;
      cell.t = null;
    }, FADE_OUT);
  }, hold);
}

const RADIUS = 78;
const FADE_OUT = 1100;   // keep in sync with #field .c opacity transition in styles.css
let mx = -9999, my = -9999, queued = false;

function sweep() {
  queued = false;
  if (document.body.dataset.page !== 'home') return;
  for (const cell of cells) {
    if (blocked(cell)) continue;
    const dx = cell.x - mx, dy = cell.y - my;
    if (dx * dx + dy * dy < RADIUS * RADIUS && (!cell.on || Math.random() < 0.02)) {
      reveal(cell, 1200 + Math.random() * 800);
    }
  }
}

if (!reduce.matches && !coarse.matches) {
  addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!queued) { queued = true; requestAnimationFrame(sweep); }
  }, { passive: true });
}

if (coarse.matches && !reduce.matches) {
  setInterval(() => {
    if (!cells.length || document.body.dataset.page !== 'home') return;
    for (let i = 0; i < 4; i++) {
      const c = cells[(Math.random() * cells.length) | 0];
      if (!blocked(c)) reveal(c, 1800);
    }
  }, 450);
}

let rtGrid, zq = false;
addEventListener('resize', () => { clearTimeout(rtGrid); rtGrid = setTimeout(buildGrid, 120); });
addEventListener('scroll', () => {
  if (!zq) { zq = true; requestAnimationFrame(() => { zq = false; measureZones(); }); }
}, { passive: true });
addEventListener('load', buildGrid);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildGrid);

/* ---------- circular page transition ---------- */
const wipe  = document.getElementById('wipe');
const disc  = wipe.querySelector('.disc');
const chars = wipe.querySelector('.chars');
let wipeCells = [], rtWipe;

function buildWipe() {
  chars.innerHTML = '';
  wipeCells = [];
  const cols = Math.ceil(innerWidth / CELL_W) + 1;
  const rows = Math.ceil(innerHeight / CELL_H) + 1;
  const frag = document.createDocumentFragment();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const el = document.createElement('span');
      el.style.cssText = `left:${c * CELL_W}px;top:${r * CELL_H}px;width:${CELL_W}px;height:${CELL_H}px`;
      frag.appendChild(el);
      wipeCells.push(el);
    }
  }
  chars.appendChild(frag);
}
addEventListener('resize', () => { clearTimeout(rtWipe); rtWipe = setTimeout(buildWipe, 160); });

function seedSymbols() {
  for (const el of wipeCells) {
    const p = POOLS[(Math.random() * POOLS.length) | 0];
    el.textContent = pick(p.s);
    el.style.color = p.col;
    el.style.opacity = (0.5 + Math.random() * 0.5).toFixed(2);
  }
}

function collapseToBinary() {
  for (const el of wipeCells) {
    setTimeout(() => {
      el.textContent = Math.random() < 0.5 ? '0' : '1';
      el.style.color = 'var(--fg)';
      el.style.opacity = '0.12';
    }, Math.random() * 600);
  }
}

function transition(applyFn) {
  if (reduce.matches || !wipeCells.length) { applyFn(); return; }
  seedSymbols();
  wipe.classList.add('run');
  disc.style.transition = 'none';
  chars.style.transition = 'none';
  disc.style.clipPath = 'circle(0% at 50% 50%)';
  chars.style.clipPath = 'circle(0% at 50% 50%)';
  requestAnimationFrame(() => {
    disc.style.transition = 'clip-path .75s cubic-bezier(.4,0,.2,1)';
    chars.style.transition = 'clip-path .75s cubic-bezier(.4,0,.2,1),opacity .4s linear';
    disc.style.clipPath = 'circle(78% at 50% 50%)';
    chars.style.clipPath = 'circle(78% at 50% 50%)';
    chars.style.opacity = '1';
    setTimeout(() => {
      applyFn();
      collapseToBinary();
      setTimeout(() => {
        disc.style.transition = 'opacity .7s ease-out';
        chars.style.transition = 'opacity .7s ease-out';
        disc.style.opacity = '0';
        chars.style.opacity = '0';
        setTimeout(() => {
          wipe.classList.remove('run');
          disc.style.opacity = '1';
          chars.style.opacity = '1';
        }, 700);
      }, 700);
    }, 760);
  });
}

/* ---------- pop-out menu ---------- */
let menuOpen = false;

function setMenu(v) {
  menuOpen = v;
  panel.hidden = !v;
  trigger.textContent = v ? 'CLOSE' : 'MENU';
  trigger.setAttribute('aria-expanded', String(v));
  measureZones();
}

trigger.addEventListener('click', e => { e.stopPropagation(); setMenu(!menuOpen); });
document.addEventListener('click', e => { if (menuOpen && !panel.contains(e.target)) setMenu(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { setMenu(false); trigger.focus(); } });

/* ---------- landing: slideshow + timeline ---------- */
const SLIDE_MS = 5500;
let slideAt = 0, slideHold = false, slideTimer = null, downX = null;

function slideHTML(s, i) {
  const media = s.image
    ? `<img src="${esc(s.image)}" alt="${esc(s.alt || s.caption)}"${i ? ' loading="lazy"' : ''} draggable="false">`
    : `<div class="ph" style="--accent:${ACCENTS[i % ACCENTS.length]}">Photo placeholder</div>`;
  return `<figure class="slide" aria-roledescription="slide" aria-label="${i + 1} of ${SLIDES.length}">
    ${media}
    <figcaption><span class="cap-tag">${esc(s.tag)}</span>${esc(s.caption)}</figcaption>
  </figure>`;
}

function buildSlides() {
  if (!SLIDES.length) { slidesEl.closest('.block').hidden = true; return; }
  slidesEl.innerHTML = `<div class="track">${SLIDES.map(slideHTML).join('')}</div>
  <div class="slide-ctrl">
    <button type="button" data-step="-1" aria-label="Previous photo">&larr;</button>
    <div class="dots">${SLIDES.map((_, i) => `<button type="button" data-go="${i}" aria-label="Show photo ${i + 1}"></button>`).join('')}</div>
    <span class="slide-n" aria-live="polite"></span>
    <button type="button" data-step="1" aria-label="Next photo">&rarr;</button>
  </div>`;
  showSlide(0);
}

function showSlide(i) {
  const n = SLIDES.length;
  slideAt = (i + n) % n;
  slidesEl.querySelectorAll('.slide').forEach((el, k) => {
    el.classList.toggle('on', k === slideAt);
    el.setAttribute('aria-hidden', String(k !== slideAt));
  });
  slidesEl.querySelectorAll('.dots button').forEach((el, k) => el.classList.toggle('on', k === slideAt));
  slidesEl.querySelector('.slide-n').textContent = `${pad(slideAt + 1)} / ${pad(n)}`;
  queueSlide();
}

// autoplay restarts after every change, so a manual click gets a full interval
function queueSlide() {
  clearTimeout(slideTimer);
  if (reduce.matches || SLIDES.length < 2) return;
  slideTimer = setTimeout(() => {
    if (slideHold || document.hidden || document.body.dataset.page !== 'home') queueSlide();
    else showSlide(slideAt + 1);
  }, SLIDE_MS);
}

slidesEl.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.step) showSlide(slideAt + Number(b.dataset.step));
  else if (b.dataset.go) showSlide(Number(b.dataset.go));
});
slidesEl.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') showSlide(slideAt - 1);
  if (e.key === 'ArrowRight') showSlide(slideAt + 1);
});
slidesEl.addEventListener('mouseenter', () => { slideHold = true; });
slidesEl.addEventListener('mouseleave', () => { slideHold = false; });
slidesEl.addEventListener('focusin', () => { slideHold = true; });
slidesEl.addEventListener('focusout', () => { slideHold = false; });
slidesEl.addEventListener('pointerdown', e => { if (e.target.closest('.track')) downX = e.clientX; });
slidesEl.addEventListener('pointerup', e => {
  if (downX === null) return;
  const dx = e.clientX - downX;
  downX = null;
  if (Math.abs(dx) > 40) showSlide(slideAt + (dx < 0 ? 1 : -1));
});

function buildTimeline() {
  if (!TIMELINE.length) { tlEl.closest('.block').hidden = true; return; }
  tlEl.style.setProperty('--n', TIMELINE.length);
  tlEl.innerHTML = TIMELINE.map((t, i) => `<li class="tl-item" style="--node:${ACCENTS[i % ACCENTS.length]}">
    <span class="tl-step">${pad(i + 1)}</span>
    <p class="tl-when">${esc(t.when)}</p>
    <h3>${esc(t.title)}</h3>
    <p>${esc(t.text)}</p>
  </li>`).join('');
}

/* ---------- templates ---------- */
const tagsHTML = x => x.disciplines
  .map(g => `<span class="${TAGCLASS[g] || ''}">${esc(g)}</span>`)
  .join('');

const reportHTML = x => x.report
  ? `<a class="report" href="${esc(x.report)}">Project report</a>`
  : `<span class="report" style="color:var(--dim);border-color:var(--line)">Report to follow</span>`;

function projHTML(x, year, i) {
  const people = x.students
    .map(s => s.email ? `${esc(s.name)} (<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>)` : esc(s.name))
    .join(', ');
  return `<article class="proj" data-year="${esc(year)}" data-i="${i}" tabindex="0" role="button" aria-haspopup="dialog">
    ${x.award ? `<p class="award">${esc(x.award)}</p>` : ''}
    <h4>${esc(x.title)}</h4>
    <p class="who">${people}</p>
    <div class="tags">${tagsHTML(x)}</div>
    <p class="abs">${esc(x.abstract)}</p>
    <div class="proj-foot">${reportHTML(x)}<span class="more">View team &amp; details &rarr;</span></div>
  </article>`;
}

/* ---------- project pop-up ---------- */
const modal  = document.getElementById('proj-modal');
const mInner = document.getElementById('m-inner');

function studentHTML(s) {
  return `<li>
    <p class="t-name">${esc(s.name)}</p>
    ${s.degree ? `<p class="t-degree">${esc(s.degree)}</p>` : ''}
    ${s.bio ? `<p class="t-about">${esc(s.bio)}</p>` : ''}
    ${s.email ? `<a class="t-mail" href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : ''}
  </li>`;
}

function openProject(year, i) {
  const x = (GALLERY[year] || [])[i];
  if (!x) return;
  mInner.innerHTML = `<button type="button" class="m-close" aria-label="Close">CLOSE &times;</button>
    <p class="award">${x.award ? esc(x.award) + ' · ' : ''}Innovation Lab ${esc(year)}</p>
    <h3 id="m-title">${esc(x.title)}</h3>
    <div class="tags">${tagsHTML(x)}</div>
    <p class="m-body">${esc(x.details || x.abstract)}</p>
    <h4 class="m-sub">The team</h4>
    <ul class="team">${x.students.map(studentHTML).join('')}</ul>
    ${reportHTML(x)}`;
  modal.showModal();
  modal.scrollTop = 0;
}

pageEl.addEventListener('click', e => {
  if (e.target.closest('a')) return;   // email and report links keep working
  const card = e.target.closest('.proj');
  if (card) openProject(card.dataset.year, Number(card.dataset.i));
});
pageEl.addEventListener('keydown', e => {
  const card = e.target.closest('.proj');
  if (card && e.target === card && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    openProject(card.dataset.year, Number(card.dataset.i));
  }
});
// close on the button or a click on the dimmed backdrop (Esc is handled by <dialog>)
modal.addEventListener('click', e => {
  if (e.target === modal || e.target.closest('.m-close')) modal.close();
});

function tabs(active) {
  return `<div class="tabs">${
    YEARS.map(y => `<a class="${String(y) === String(active) ? 'on' : ''}" href="#/gallery/${y}">${y}</a>`).join('')
  }</div>`;
}

function galleryIndex() {
  return `<div class="sec-head">
    <p class="sec-name">Project Gallery</p>
    <h2>Every Innovation Lab, year by year</h2>
    <p class="lede">Each summer, teams of Natural Sciences students design and run a project of their own. These are the results, as presented at the Induction Week showcase.</p>
  </div>` + YEARS.map(y => {
    const list = GALLERY[y] || [];
    const winner = list.find(x => x.award === 'Best Project');
    return `<a class="yearcard" href="#/gallery/${y}">
      <span class="y">${y}</span>
      <span class="m">${list.length} project${list.length === 1 ? '' : 's'}${winner ? ' \u00b7 ' + esc(winner.title) : ''}</span>
    </a>`;
  }).join('');
}

function galleryYear(year) {
  const list = GALLERY[year] || [];
  return `<div class="sec-head">
    <p class="sec-name"><a href="#/gallery" style="color:inherit;text-decoration:none">Project Gallery</a></p>
    <h2>Innovation Lab ${esc(year)}</h2>
    ${tabs(year)}
  </div>
  <p class="count">${list.length} project${list.length === 1 ? '' : 's'}</p>
  ${list.map((x, i) => projHTML(x, year, i)).join('')}`;
}

const ABOUT = `<h2>About the programme</h2>
<p>Innovation Lab is a programme of independent, student-led summer projects for students on the UCL Natural Sciences Programme. Students form small teams and work on a project of their own design connected to any area of Natural Sciences.</p>
<p>The programme begins at the end of Term 3, with a session where students meet, share ideas and form teams. Projects run over the summer, and teams present their results at a student showcase during Induction Week.</p>
<h3>Get involved</h3>
<p>The programme is open to Natural Sciences students in years 1 to 4, including those not based in London over the summer. First-year students are especially encouraged to take part.</p>
<p>To register interest or ask a question, contact Dr Peter Bratby.</p>
<p><a class="report" href="#/contact">Contact details</a></p>`;

const CONTACT = `<h2>Contact</h2>
<p class="contact-line">Dr Peter Bratby<br><em>Lecturer in Natural Sciences</em><br><a href="mailto:p.bratby@ucl.ac.uk">p.bratby@ucl.ac.uk</a></p>`;

/* ---------- routing ---------- */
let current = null;

function apply(hash) {
  const gal = hash.match(/^\/gallery\/(\d{4})$/);
  panel.querySelectorAll('a').forEach(a => a.classList.toggle('current', a.dataset.route === hash));

  if (hash === '/') {
    document.body.dataset.page = 'home';
    homeEl.hidden = false;
    pageEl.hidden = true;
    pageEl.innerHTML = '';
    scrollTo(0, 0);
  } else {
    document.body.dataset.page = 'page';
    homeEl.hidden = true;
    pageEl.hidden = false;
    if (gal && GALLERY[gal[1]]) pageEl.innerHTML = galleryYear(gal[1]);
    else if (hash === '/gallery')  pageEl.innerHTML = galleryIndex();
    else if (hash === '/about')    pageEl.innerHTML = ABOUT;
    else if (hash === '/contact')  pageEl.innerHTML = CONTACT;
    else pageEl.innerHTML = `<h2>Page not found</h2><p>Open the menu to browse the project gallery.</p>`;
    scrollTo(0, 0);
  }
  requestAnimationFrame(measureZones);
}

function render() {
  const hash = location.hash.replace(/^#/, '') || '/';
  setMenu(false);
  if (modal.open) modal.close();
  if (current === null) { apply(hash); current = hash; return; }
  if (current === hash) return;

  const inGallery = r => r.indexOf('/gallery') === 0;
  const stayInGallery = inGallery(current) && inGallery(hash);
  current = hash;

  if (stayInGallery) { apply(hash); return; }   // year switching: no transition
  transition(() => apply(hash));
}

addEventListener('hashchange', render);

/* ---------- start ---------- */
buildGrid();
buildWipe();

loadContent()
  .then(() => { buildSlides(); buildTimeline(); render(); })
  .catch(err => {
    console.error(err);
    document.body.dataset.page = 'page';
    homeEl.hidden = true;
    pageEl.hidden = false;
    pageEl.innerHTML = `<h2>Content failed to load</h2>
      <p>data/projects.json could not be read. If you opened this file directly from disk,
      serve it instead — in VS Code, right-click index.html and choose "Open with Live Server".</p>`;
  });
