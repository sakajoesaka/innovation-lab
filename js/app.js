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

const pick = a => a[(Math.random() * a.length) | 0];
const esc = str => String(str).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

const field   = document.getElementById('field');
const hero    = document.getElementById('hero');
const panel   = document.getElementById('panel');
const trigger = document.getElementById('trigger');
const markEl  = document.querySelector('.mark');
const homeEl  = document.getElementById('home');
const pageEl  = document.getElementById('page');

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarse = window.matchMedia('(pointer: coarse)');

/* ---------- content, loaded from JSON ---------- */
let YEARS = [];
let GALLERY = {};

async function loadContent() {
  const res = await fetch('data/projects.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('projects.json ' + res.status);
  const data = await res.json();
  YEARS = data.years.map(y => y.year);
  GALLERY = {};
  for (const y of data.years) GALLERY[y.year] = y.projects;
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
  const add = (n, px, py, trimTop = 0) => {
    if (!n || n.hidden) return;
    const b = n.getBoundingClientRect();
    if (!b.width) return;
    zones.push({ l: b.left - px, r: b.right + px, t: b.top - py + trimTop, b: b.bottom + py });
  };
  // trim one grid row off the top so the title's blocked area is balanced
  if (document.body.dataset.page === 'home') add(hero, 56, 40, CELL_H);
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

let rtGrid;
addEventListener('resize', () => { clearTimeout(rtGrid); rtGrid = setTimeout(buildGrid, 120); });
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

/* ---------- templates ---------- */
function projHTML(x, year) {
  const people = x.students
    .map(s => s.email ? `${esc(s.name)} (<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>)` : esc(s.name))
    .join(', ');
  const tags = x.disciplines
    .map(g => `<span class="${TAGCLASS[g] || ''}">${esc(g)}</span>`)
    .join('');
  const report = x.report
    ? `<a class="report" href="${esc(x.report)}">Project report</a>`
    : `<span class="report" style="color:var(--dim);border-color:var(--line)">Report to follow</span>`;
  return `<article class="proj">
    ${x.award ? `<p class="award">${esc(x.award)}</p>` : ''}
    <h4>${esc(x.title)}</h4>
    <p class="who">${people}</p>
    <div class="tags">${tags}</div>
    <p class="abs">${esc(x.abstract)}</p>
    ${report}
  </article>`;
}

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
  ${list.map(x => projHTML(x, year)).join('')}`;
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
  .then(render)
  .catch(err => {
    console.error(err);
    document.body.dataset.page = 'page';
    homeEl.hidden = true;
    pageEl.hidden = false;
    pageEl.innerHTML = `<h2>Content failed to load</h2>
      <p>data/projects.json could not be read. If you opened this file directly from disk,
      serve it instead — in VS Code, right-click index.html and choose "Open with Live Server".</p>`;
  });
