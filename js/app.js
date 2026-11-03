/* Bakery 2000: prévia. Tudo calculado na hora da Flórida (America/New_York). */
(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const B = document.body;
  const PT = B.dataset.lang === 'pt';
  const T = (en, pt) => (PT ? pt : en);
  const UNITS = JSON.parse(B.dataset.units || '[]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- Hora da Flórida ----------
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false });
  const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  function fl() {
    const p = Object.fromEntries(fmt.formatToParts(new Date()).map(x => [x.type, x.value]));
    const h = +p.hour % 24, m = +p.minute;
    return { y: +p.year, mo: +p.month, da: +p.day, d: WD[p.weekday], h, m, t: h + m / 60 };
  }
  // Data "civil" da Flórida somando dias (UTC ao meio-dia para evitar fuso)
  const civil = (n = 0) => { const f = fl(); const x = new Date(Date.UTC(f.y, f.mo - 1, f.da + n, 12)); return x; };
  const iso = x => x.toISOString().slice(0, 10);
  const dayName = (x, opt = { weekday: 'long', month: 'short', day: 'numeric' }) => x.toLocaleDateString(PT ? 'pt-BR' : 'en-US', { ...opt, timeZone: 'UTC' });
  const hh = h => (PT ? `${h}h` : h === 12 ? '12 PM' : h === 0 || h === 24 ? '12 AM' : h > 12 ? `${h - 12} PM` : `${h} AM`);
  const clock = (h, m) => (PT ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` : `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`);
  const dur = mins => { const H = Math.floor(mins / 60), M = Math.round(mins % 60); return H ? `${H}h ${String(M).padStart(2, '0')}min` : `${M} min`; };

  function status(u, f = fl()) {
    const [o, c] = u.hours[f.d];
    if (f.t >= o && f.t < c) {
      const left = (c - f.t) * 60;
      return { open: true, txt: left <= 60 ? T(`Open · closes in ${dur(left)}`, `Aberta · fecha em ${dur(left)}`) : T(`Open · until ${hh(c)}`, `Aberta · até ${hh(c)}`) };
    }
    if (f.t < o) return { open: false, txt: T(`Closed · opens at ${hh(o)}`, `Fechada · abre às ${hh(o)}`) };
    const n = u.hours[(f.d + 1) % 7][0];
    return { open: false, txt: T(`Closed · opens tomorrow ${hh(n)}`, `Fechada · abre amanhã às ${hh(n)}`) };
  }

  function moment(f) {
    if (f.d === 6 && f.t >= 22) return T('Viola do Didi is on: live sertanejo in Deerfield Beach right now.', 'Tem Viola do Didi agora: sertanejo ao vivo em Deerfield Beach.');
    if (f.t < 6 || f.t >= 22) return T('The ovens rest now. Coffee is back at 6 AM.', 'Os fornos descansam agora. O café volta às 6h.');
    if (f.d === 0 && f.t < 7) return T('Sunday opens at 7 AM. Fresh bread is on the way.', 'Domingo abre às 7h. O pão já está a caminho.');
    if (f.t < 11) return T('Breakfast time: fresh-brewed coffee and warm bread.', 'Hora do café: café passado na hora e pão quentinho.');
    if (f.t < 15) return T('Lunch at the counter: griddle plates are on.', 'Almoço no balcão: a chapa está ligada.');
    if (f.t < 18) return T('Afternoon snack: coxinha and a cafezinho.', 'Lanche da tarde: coxinha e um cafezinho.');
    return T('A sweet after dinner, straight from the case.', 'O docinho depois do jantar, direto da vitrine.');
  }

  function tick() {
    const f = fl();
    // Status das unidades
    UNITS.forEach(u => {
      const s = status(u, f);
      $$(`[data-status="${u.id}"]`).forEach(el => { el.textContent = s.txt; el.classList.toggle('st-open', s.open); el.classList.toggle('st-closed', !s.open); });
    });
    $$('.hours tr').forEach(tr => tr.classList.toggle('today', +tr.dataset.day === f.d));
    // Painel "agora"
    const c = $('[data-now-clock]');
    if (c) {
      c.textContent = clock(f.h, f.m);
      $('[data-now-msg]').textContent = moment(f);
      const anyOpen = UNITS.some(u => status(u, f).open);
      $('[data-now-dot]').classList.toggle('on', anyOpen);
      $('[data-now-label]').textContent = T(`Florida time · ${anyOpen ? 'open now' : 'closed now'}`, `Hora na Flórida · ${anyOpen ? 'aberta agora' : 'fechada agora'}`);
      const pct = Math.max(0, Math.min(1, (f.t - 6) / 16));
      $('[data-now-fill]').style.width = `${pct * 100}%`;
      const sun = $('[data-now-sun]');
      sun.style.left = `${pct * 100}%`;
      sun.classList.toggle('moon', f.t < 6 || f.t >= 22);
    }
    // Prazo das encomendas
    const dl = $('[data-deadline]');
    if (dl) {
      const before = f.t < 16;
      dl.classList.toggle('late', !before);
      $('[data-deadline-txt]').textContent = before
        ? T(`${dur((16 - f.t) * 60)} left · pickup from tomorrow`, `Faltam ${dur((16 - f.t) * 60)} · retirada a partir de amanhã`)
        : T(`Past 4 PM · pickup from ${dayName(civil(2), { weekday: 'long' })}`, `Passou das 16h · retirada a partir de ${dayName(civil(2), { weekday: 'long' })}`);
    }
    // Próxima Viola do Didi
    const ns = $('[data-next-sat]');
    if (ns) {
      let txt, inTxt = '';
      if (f.d === 6 && f.t >= 22) { txt = T('Happening now', 'Acontecendo agora'); }
      else if (f.d === 6) { txt = T('Tonight, 10 PM', 'Hoje, às 22h'); inTxt = T(`in ${dur((22 - f.t) * 60)}`, `em ${dur((22 - f.t) * 60)}`); }
      else { const n = (6 - f.d + 7) % 7; txt = `${dayName(civil(n))}, ${T('10 PM', '22h')}`; inTxt = n === 1 ? T('tomorrow', 'amanhã') : T(`in ${n} days`, `em ${n} dias`); }
      ns.textContent = txt;
      $('[data-next-sat-in]').textContent = inTxt;
    }
    const sp = $('[data-special]');
    if (sp) sp.hidden = iso(civil(0)) > sp.dataset.date;
    const yr = $('[data-year]');
    if (yr) yr.textContent = f.y;
  }
  tick();
  setInterval(tick, 20000);

  // ---------- Aniversário ----------
  const bd = $('[data-bday]');
  if (bd) {
    const out = $('[data-bday-out]'), msg = $('[data-bday-msg]');
    const upd = () => {
      const n = +bd.value; out.textContent = n;
      if (n >= 15) { msg.textContent = T('15 or more: the cake to sing Happy Birthday is on the bakery.', '15 ou mais: o bolo para cantar os parabéns é por conta da padaria.'); msg.classList.add('win'); }
      else { const k = 15 - n; msg.textContent = T(`Invite ${k} more and the cake is on the bakery.`, `Chame mais ${k} ${k === 1 ? 'pessoa' : 'pessoas'} e o bolo é por conta da padaria.`); msg.classList.remove('win'); }
    };
    bd.addEventListener('input', upd); upd();
  }

  // ---------- Reel do Instagram (carrega só ao tocar) ----------
  const reel = $('[data-reel]');
  if (reel) reel.addEventListener('click', () => {
    const box = document.createElement('div');
    box.className = 'reel-frame';
    box.innerHTML = `<iframe src="${reel.dataset.reel}" title="${T('Viola do Didi on Instagram', 'Viola do Didi no Instagram')}" allow="autoplay; encrypted-media" loading="lazy"></iframe>`;
    reel.parentElement.appendChild(box);
    reel.hidden = true;
  });

  // ---------- Cardápio: categoria ativa ----------
  const chips = $('[data-chips]');
  if (chips && 'IntersectionObserver' in window) {
    const links = $$('a', chips);
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === `#${e.target.id}`));
      const on = links.find(a => a.classList.contains('on'));
      if (on) chips.scrollTo({ left: on.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
    }), { rootMargin: '-40% 0px -55% 0px' });
    $$('.mcat').forEach(s => io.observe(s));
  }

  // ---------- Construtor de encomenda ----------
  const bld = $('[data-builder]');
  if (bld) {
    const KEY = 'b2000-order';
    const lines = $$('[data-line]', bld);
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
    const qtyOf = li => Math.max(0, Math.min(999, parseInt($('[data-qty]', li).value, 10) || 0));
    const setQty = (li, v) => { $('[data-qty]', li).value = Math.max(0, Math.min(999, v)); };
    const unitSel = () => UNITS.find(u => u.id === ($('input[name=unit]:checked', bld) || {}).value) || UNITS[0];

    // restaura
    if (saved.q) lines.forEach(li => { if (saved.q[li.dataset.line]) setQty(li, saved.q[li.dataset.line]); });
    ['flavor', 'writing', 'name', 'notes', 'occasion', 'time'].forEach(k => { const el = $(`[data-${k}]`, bld); if (el && saved[k]) el.value = saved[k]; });
    if (saved.unit) { const r = $(`input[name=unit][value="${saved.unit}"]`, bld); if (r) r.checked = true; }

    // ?add=id vindo do cardápio
    const add = new URLSearchParams(location.search).get('add');
    if (add) {
      const li = lines.find(l => l.dataset.line === add);
      if (li && !qtyOf(li)) setQty(li, li.dataset.unit === 'un' ? 25 : li.dataset.unit === 'lb' ? 2 : 1);
      if (li) setTimeout(() => li.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }), 300);
      history.replaceState(null, '', location.pathname);
    }

    // data mínima: até 16h retira amanhã; depois, depois de amanhã
    const dateEl = $('[data-date]', bld), timeEl = $('[data-time]', bld), hint = $('[data-date-hint]', bld);
    const minDate = () => civil(fl().t < 16 ? 1 : 2);
    dateEl.min = iso(minDate());
    if (saved.date && saved.date >= dateEl.min) dateEl.value = saved.date; else dateEl.value = dateEl.min;

    // barra-resumo no celular, some quando o ticket está na tela
    let sumN = 0, tkVisible = false;
    const sum = $('[data-sum]', bld);
    const sumUpd = () => { sum.hidden = !sumN || tkVisible; };
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { tkVisible = es[0].isIntersecting; sumUpd(); }).observe($('.b-ticket', bld));

    const name = li => $('.line-name b', li).textContent;
    function text() {
      const u = unitSel();
      const items = lines.filter(li => qtyOf(li) > 0).map(li => {
        const q = qtyOf(li), t = li.dataset.unit;
        let s = t === 'lb' ? `${q} lb · ${name(li)}` : `${q} × ${name(li)}`;
        if (li.dataset.line === 'bolo') {
          const fl2 = $('[data-flavor]', li).value.trim(), wr = $('[data-writing]', li).value.trim();
          if (fl2) s += ` (${T('flavor', 'sabor')}: ${fl2})`;
          if (wr) s += ` (${T('writing', 'escrita')}: "${wr}")`;
        }
        return s;
      });
      const d = dateEl.value ? new Date(`${dateEl.value}T12:00:00Z`) : null;
      const occ = $('[data-occasion]', bld).value, nm = $('[data-name]', bld).value.trim(), notes = $('[data-notes]', bld).value.trim();
      const out = [
        T('Hi Bakery 2000! I’d like to place a party order:', 'Olá, Padaria 2000! Quero fazer uma encomenda:'),
        ...items.map(s => `• ${s}`),
        '',
        `${T('Pickup', 'Retirada')}: ${u.name}${d ? `, ${dayName(d)}` : ''}${timeEl.value ? `, ${timeEl.value}` : ''}`,
      ];
      if (nm) out.push(`${T('Name', 'Nome')}: ${nm}`);
      if (occ) out.push(`${T('Occasion', 'Ocasião')}: ${occ}`);
      if (notes) out.push(`${T('Notes', 'Observações')}: ${notes}`);
      out.push(T('Could you confirm the total and the pickup time? Thank you!', 'Pode confirmar o valor e o horário? Obrigado!'));
      return { items, txt: out.join('\n'), u, d };
    }

    function render() {
      lines.forEach(li => {
        const q = qtyOf(li);
        li.classList.toggle('on', q > 0);
        $$('[data-quick]', li).forEach(b => b.classList.toggle('on', +b.dataset.quick === q));
        const cake = $('[data-cake]', li); if (cake) cake.hidden = q === 0;
      });
      const { items, u, d } = text();
      const ul = $('[data-ticket]', bld);
      const prev = ul.textContent;
      ul.innerHTML = items.map(s => `<li><span>${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span></li>`).join('');
      if (prev === ul.textContent) $$('li', ul).forEach(li => { li.style.animation = 'none'; });
      $('[data-empty]', bld).hidden = items.length > 0;
      sumN = items.length; $('[data-sum-n]', bld).textContent = sumN; sumUpd();
      $('[data-ticket-foot]', bld).textContent = `${T('PICKUP', 'RETIRADA')} · ${u.name.toUpperCase()}${d ? ` · ${dayName(d, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}` : ''}${timeEl.value ? ` · ${timeEl.value}` : ''}`;
      const call = $('[data-call]', bld);
      call.href = `tel:${u.phone}`;
      $('[data-call-txt]', bld).textContent = `${T('Call', 'Ligar')} ${u.phoneLabel}`;
      // horário dentro do funcionamento
      let warn = '';
      if (d) {
        const wd = d.getUTCDay(), [o, c] = u.hours[wd];
        const [H, M] = (timeEl.value || '10:00').split(':').map(Number);
        const t = H + M / 60;
        if (t < o || t >= c) warn = T(`${u.name} is open ${hh(o)} to ${hh(c)} on that day.`, `${u.name} abre das ${hh(o)} às ${hh(c)} nesse dia.`);
      }
      hint.textContent = warn || T(`Orders until 4 PM. Earliest pickup: ${dayName(minDate())}`, `Encomendas até as 16h. Primeira retirada possível: ${dayName(minDate())}`);
      hint.style.color = warn ? 'var(--red)' : '';
      // salva
      const q = {}; lines.forEach(li => { const v = qtyOf(li); if (v) q[li.dataset.line] = v; });
      const st = { q, unit: u.id, date: dateEl.value };
      ['flavor', 'writing', 'name', 'notes', 'occasion', 'time'].forEach(k => { const el = $(`[data-${k}]`, bld); if (el) st[k] = el.value; });
      try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* sem armazenamento */ }
    }

    bld.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const li = b.closest('[data-line]');
      if (li && b.hasAttribute('data-inc')) setQty(li, qtyOf(li) + (li.dataset.unit === 'un' ? 5 : 1));
      else if (li && b.hasAttribute('data-dec')) setQty(li, qtyOf(li) - (li.dataset.unit === 'un' ? 5 : 1));
      else if (li && b.dataset.quick) setQty(li, +b.dataset.quick);
      else return;
      render();
    });
    bld.addEventListener('input', render);
    bld.addEventListener('change', render);
    $('[data-form]', bld).addEventListener('submit', e => e.preventDefault());

    const msg = $('[data-send-msg]', bld);
    const say = (s, err) => { msg.textContent = s; msg.classList.toggle('err', !!err); };
    const ready = () => {
      const { items } = text();
      if (!items.length) { say(T('Add at least one item first.', 'Adicione pelo menos um item.'), true); return null; }
      if (!dateEl.value) { say(T('Choose the pickup day.', 'Escolha o dia da retirada.'), true); dateEl.focus(); return null; }
      return text().txt;
    };
    async function copy(s) {
      try { await navigator.clipboard.writeText(s); return true; } catch (e) {
        const ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } ta.remove(); return ok;
      }
    }
    $('[data-copy]', bld).addEventListener('click', async () => {
      const s = ready(); if (!s) return;
      say(await copy(s) ? T('Order copied. Paste it in a message or read it on the call.', 'Pedido copiado. Cole numa mensagem ou leia na ligação.') : T('Could not copy automatically; select the ticket text.', 'Não deu para copiar automaticamente; selecione o texto do ticket.'), false);
    });
    $('[data-dm]', bld).addEventListener('click', async () => {
      const s = ready(); if (!s) return;
      const ok = await copy(s);
      say(ok ? T('Copied. Instagram is opening: paste the order in the chat.', 'Copiado. O Instagram está abrindo: cole o pedido na conversa.') : T('Instagram is opening. Copy the ticket text to paste it.', 'O Instagram está abrindo. Copie o texto do ticket para colar.'), false);
      window.open('https://ig.me/m/padaria2000.bakery', '_blank', 'noopener');
    });
    $('[data-call]', bld).addEventListener('click', e => { if (!text().items.length) { e.preventDefault(); say(T('Add your items first, so the order is on screen while you call.', 'Adicione os itens antes, para o pedido ficar na tela durante a ligação.'), true); } });
    render();
  }

  // ---------- Movimento ----------
  window.addEventListener('load', () => {
    if (reduce || !window.gsap) return;
    const { gsap } = window;
    gsap.registerPlugin(window.ScrollTrigger);
    const ST = window.ScrollTrigger;
    if (window.Lenis) {
      const lenis = new window.Lenis({ lerp: 0.12 });
      lenis.on('scroll', ST.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -130 }); } }));
    }
    // Herói
    if ($('.hero')) {
      gsap.from('.hero h1, .hero .lead, .hero .row, .hero .eyebrow', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08 });
      gsap.from('.now', { y: 40, opacity: 0, duration: 1.1, delay: 0.3, ease: 'power3.out' });
      gsap.to('.hero-img img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
    if ($('.page-head')) gsap.from('.page-head > *', { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 });

    const mm = gsap.matchMedia();
    // Linha do dia: rolagem horizontal fixada no desktop (criada antes das demais, na ordem do DOM)
    mm.add('(min-width: 900px)', () => {
      const day = $('[data-day-scroller]'), rail = $('[data-day-rail]');
      if (!day || !rail) return;
      const dist = () => Math.max(0, rail.scrollWidth - window.innerWidth + 40);
      const tw = gsap.to(rail, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: day, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true } });
      $$('.moment-t', rail).forEach(el => gsap.from(el, { opacity: 0.15, scrollTrigger: { trigger: el, containerAnimation: tw, start: 'left 85%', end: 'left 45%', scrub: true } }));
    });

    // Noite: o pôr do sol vira noite ao entrar na seção
    $$('[data-night]').forEach(n => {
      gsap.fromTo(n, { '--dusk': 1 }, { '--dusk': 0, ease: 'none', scrollTrigger: { trigger: n, start: 'top bottom', end: 'top 15%', scrub: true } });
      gsap.from($$('.poster', n), { y: 80, rotate: 0, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: n, start: 'top 60%' } });
    });

    // Ticket "imprimindo"
    $$('.ticket-sec .ticket').forEach(t => gsap.from(t, { clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'power2.inOut', scrollTrigger: { trigger: t, start: 'top 75%' } }));

    // Revelações simples
    const rv = $$('.display:not(.hero .display), .moment, .unit, .plate, .item, .step, .bday, .story blockquote');
    rv.forEach(el => el.classList.add('rv'));
    ST.batch(rv, { start: 'top 88%', onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, overwrite: true }) });
    ST.refresh();
  });
})();
