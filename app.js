/* Calle de los Museos: corrientes psicológicas — lógica de la app */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#app"), sheet = $("#sheet"), toast = $("#toast");

  const ICON = {
    museo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10 12 4l9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18M4 18h16"/></svg>',
    flecha: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    atras: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const iniciales = (n) => n.replace(/[.]/g, "").split(/\s+/).filter((p) => /^[A-ZÁÉÍÓÚÑ]/.test(p)).map((p) => p[0]).slice(0, 2).join("");

  /* ---------- Fotos: foto propia > Wikipedia (en caché) > iniciales ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch {} }
  };
  const fotoPropia = (a) => store.get("foto:" + a.n);

  async function urlWiki(a) {
    const k = "wiki:" + a.w;
    const c = store.get(k);
    if (c) return c === "none" ? null : c;
    try {
      const r = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(a.w.replace(/ /g, "_")));
      if (!r.ok) throw 0;
      const j = await r.json();
      const u = j.thumbnail && j.thumbnail.source;
      store.set(k, u || "none");
      return u || null;
    } catch { return null; }
  }

  function pintarFoto(cont, a, h) {
    cont.innerHTML = `<div class="ini" style="--h:${h}">${esc(iniciales(a.n))}</div>`;
    const propia = fotoPropia(a);
    const poner = (src) => {
      const img = new Image();
      img.alt = a.n;
      img.onload = () => { cont.querySelector("img")?.remove(); cont.appendChild(img); };
      img.src = src;
    };
    if (propia) return poner(propia);
    urlWiki(a).then((u) => u && poner(u));
  }

  /* ---------- Vistas ---------- */
  function splash() {
    app.innerHTML = `
      <section class="splash">
        <div>
          <div class="logo">${ICON.museo}</div>
          <h1>Calle de los Museos: corrientes psicológicas</h1>
          <p>Un recorrido por la historia de la psicología. Entra a un museo, toca un cuadro y descubre a sus autores, su contexto y su método.</p>
          <button class="btn-main" id="entrar">Entrar ${ICON.flecha}</button>
        </div>
      </section>`;
    $("#entrar").onclick = () => { sessionStorage.setItem("dentro", "1"); location.hash = "#/calle"; };
  }

  function calle(filtro = "") {
    const q = norm(filtro);
    const lista = MUSEOS.filter((m) => !q || norm(m.nombre + " " + m.desc + " " + m.autores.map((a) => a.n).join(" ")).includes(q));
    app.innerHTML = `
      <div class="wrap">
        <header class="top">
          <div class="ico">${ICON.museo}</div>
          <div>
            <h1>Calle de los Museos: corrientes psicológicas</h1>
            <p>Entra a un museo, toca un cuadro y descubre autores, preceptos, objeto de estudio y técnicas.</p>
          </div>
        </header>
        <div class="search"><input id="buscar" type="search" placeholder="Buscar corriente o autor…" value="${esc(filtro)}" autocomplete="off"></div>
        <div class="grid">
          ${lista.map((m) => `
            <button class="museo" data-id="${m.id}" style="--h:${m.hue}">
              <span class="pill">${ICON.museo}${esc(m.epoca)}</span>
              <h2>${esc(m.nombre)}</h2>
              <p class="d">${esc(m.desc)}</p>
              <div class="f"><span class="q">“${esc(m.lema)}”</span><span class="enter">Entrar ${ICON.flecha}</span></div>
            </button>`).join("") || '<p style="color:var(--muted)">No se encontraron resultados.</p>'}
        </div>
      </div>`;
    app.querySelectorAll(".museo").forEach((b) => (b.onclick = () => (location.hash = "#/m/" + b.dataset.id)));
    const inp = $("#buscar");
    inp.oninput = () => {
      const pos = inp.selectionStart;
      calle(inp.value);
      const n = $("#buscar"); n.focus(); n.setSelectionRange(pos, pos);
    };
  }

  function sala(id) {
    const m = MUSEOS.find((x) => x.id === id);
    if (!m) return (location.hash = "#/calle");
    app.innerHTML = `
      <div class="wrap" style="--h:${m.hue}">
        <button class="back" id="volver">${ICON.atras} Calle de los Museos</button>
        <section class="sala-head">
          <span class="pill">${ICON.museo}${esc(m.epoca)}</span>
          <h1>${esc(m.nombre)}</h1>
          <p class="d">${esc(m.desc)}</p>
          <p class="q">“${esc(m.lema)}”</p>
        </section>
        <section class="info">
          <div class="box"><h3>Objeto de estudio</h3><p>${esc(m.obj)}</p></div>
          <div class="box"><h3>Preceptos</h3><ul>${m.prec.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
          <div class="box"><h3>Técnicas</h3><ul>${m.tec.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
        </section>
        <h2 class="sec-title">Autores<small>Toca un cuadro para ver su ficha</small></h2>
        <section class="galeria">
          ${m.autores.map((a, i) => `
            <button class="cuadro" data-i="${i}">
              <div class="marco"><div class="passe"><div class="foto" data-foto="${i}"></div></div></div>
              <div class="nm">${esc(a.n)}</div>
              <div class="yr">${esc(a.y)}</div>
            </button>`).join("")}
        </section>
      </div>`;
    $("#volver").onclick = () => (location.hash = "#/calle");
    app.querySelectorAll("[data-foto]").forEach((el) => pintarFoto(el, m.autores[+el.dataset.foto], m.hue));
    app.querySelectorAll(".cuadro").forEach((b) => (b.onclick = () => ficha(m, +b.dataset.i)));
    window.scrollTo(0, 0);
  }

  /* ---------- Ficha del autor ---------- */
  let teclaActual = null;

  // Cierra la ficha en pantalla sin tocar el historial.
  function cerrarUI() {
    sheet.hidden = true; sheet.innerHTML = ""; document.body.style.overflow = "";
    if (teclaActual) { document.removeEventListener("keydown", teclaActual); teclaActual = null; }
  }
  // Botón X, fondo, Escape: retroceden una entrada del historial (igual que el botón atrás),
  // y el listener de popstate cierra la ficha.
  function cerrarFicha() {
    if (history.state && history.state.ficha) history.back(); else cerrarUI();
  }
  // Botón atrás de Android (o del navegador): si hay una ficha abierta, solo se cierra la ficha.
  window.addEventListener("popstate", () => { if (!sheet.hidden) cerrarUI(); });

  function ficha(m, i) {
    const a = m.autores[i];
    const x = (typeof EXTRA !== "undefined" && EXTRA[a.n]) || null;
    // Abrir una ficha crea una entrada de historial; cambiar de autor dentro de la ficha no.
    if (!(history.state && history.state.ficha)) { try { history.pushState({ ficha: 1 }, ""); } catch (e) {} }
    if (teclaActual) { document.removeEventListener("keydown", teclaActual); teclaActual = null; }
    sheet.hidden = false;
    document.body.style.overflow = "hidden";
    sheet.innerHTML = `
      <div class="panel" role="dialog" aria-modal="true" aria-label="${esc(a.n)}">
        <div class="panel-head" style="--h:${m.hue}">
          <div class="marco"><div class="passe"><div class="foto" id="fotoFicha"></div></div></div>
          <div>
            <h2>${esc(a.n)}</h2>
            <div class="rol">${esc(a.rol)}</div>
            <div class="yr">${esc(a.y)} · ${esc(m.nombre)}</div>
          </div>
          <button class="close" id="cerrar" aria-label="Cerrar">${ICON.x}</button>
        </div>
        <div class="body">
          ${x ? `<div class="pos">
            <div class="pbox"><h3>Objeto de estudio</h3><span class="ask">¿Qué define como “psicología”?</span><p>${esc(x.o)}</p></div>
            <div class="pbox"><h3>Metáfora de la mente</h3><span class="ask">Su postura de base</span><p>${esc(x.m)}</p></div>
            <div class="pbox"><h3>Enemigo teórico</h3><span class="ask">¿Contra quién debatía?</span><p>${esc(x.e)}</p></div>
          </div>` : ""}
          <div class="blk"><h3>Aportaciones</h3><ul>${a.ap.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
          <div class="blk"><h3>Contexto histórico</h3><p>${esc(a.ctx)}</p></div>
          <div class="blk"><h3>Contexto biográfico</h3><p>${esc(a.bio)}</p></div>
          <div class="blk"><h3>Contexto metodológico</h3><p>${esc(a.met)}</p></div>
          <div class="blk"><div class="actions">
            <button class="chip" id="subir">Poner mi propia foto</button>
            ${fotoPropia(a) ? '<button class="chip" id="quitar">Quitar mi foto</button>' : ""}
            <input id="archivo" class="hidden-file" type="file" accept="image/*">
          </div></div>
        </div>
        <div class="nav">
          <button class="chip" id="ant" ${i === 0 ? "disabled style='opacity:.35'" : ""}>← Anterior</button>
          <button class="chip" id="sig" ${i === m.autores.length - 1 ? "disabled style='opacity:.35'" : ""}>Siguiente →</button>
        </div>
        <div class="credit">Las fotos se cargan automáticamente de Wikipedia/Wikimedia Commons cuando hay conexión. Sin foto se muestran las iniciales.</div>
      </div>`;
    pintarFoto($("#fotoFicha"), a, m.hue);

    // Anterior/Siguiente y recargar la ficha no tocan el historial: solo cambia el contenido.
    const ir = (j) => { cerrarUI(); ficha(m, j); };
    const tecla = (e) => {
      if (e.key === "Escape") cerrarFicha();
      if (e.key === "ArrowRight" && i < m.autores.length - 1) ir(i + 1);
      if (e.key === "ArrowLeft" && i > 0) ir(i - 1);
    };
    teclaActual = tecla;
    document.addEventListener("keydown", tecla);
    $("#cerrar").onclick = cerrarFicha;
    sheet.onclick = (e) => { if (e.target === sheet) cerrarFicha(); };
    $("#ant").onclick = () => { if (i > 0) ir(i - 1); };
    $("#sig").onclick = () => { if (i < m.autores.length - 1) ir(i + 1); };

    $("#subir").onclick = () => $("#archivo").click();
    $("#archivo").onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        const im = new Image();
        im.onload = () => {
          const W = 400, H = 500, c = document.createElement("canvas");
          c.width = W; c.height = H;
          const ctx = c.getContext("2d");
          const esc2 = Math.max(W / im.width, H / im.height);
          const w = im.width * esc2, h = im.height * esc2;
          ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
          const ok = store.set("foto:" + a.n, c.toDataURL("image/jpeg", 0.85));
          mostrar(ok ? "Foto guardada en este dispositivo" : "No hubo espacio para guardar la foto");
          ir(i);
          const g = app.querySelector(`[data-foto="${i}"]`); if (g) pintarFoto(g, a, m.hue);
        };
        im.src = rd.result;
      };
      rd.readAsDataURL(f);
    };
    const q = $("#quitar");
    if (q) q.onclick = () => {
      store.del("foto:" + a.n);
      ir(i);
      const g = app.querySelector(`[data-foto="${i}"]`); if (g) pintarFoto(g, a, m.hue);
    };
  }

  function mostrar(t) {
    toast.textContent = t; toast.hidden = false;
    clearTimeout(mostrar.t); mostrar.t = setTimeout(() => (toast.hidden = true), 2400);
  }

  /* ---------- Rutas ---------- */
  function ruta() {
    cerrarUI();
    const h = location.hash || "";
    if (h.startsWith("#/m/")) return sala(decodeURIComponent(h.slice(4)));
    if (h === "#/calle") return calle();
    if (sessionStorage.getItem("dentro") === "1") return calle();
    splash();
  }
  window.addEventListener("hashchange", ruta);
  // Si se recarga con una entrada de ficha en el historial, se limpia: la ficha no sobrevive a la recarga.
  if (history.state && history.state.ficha) { try { history.replaceState(null, ""); } catch (e) {} }
  ruta();

  /* ---------- Actualización con botón ---------- */
  function avisoActualizacion() {
    if (document.getElementById("upd")) return;
    const b = document.createElement("div");
    b.id = "upd"; b.className = "upd"; b.setAttribute("role", "status");
    b.innerHTML = '<span>Hay una nueva versión del museo</span>';
    const btn = document.createElement("button");
    btn.type = "button"; btn.textContent = "Actualizar";
    btn.addEventListener("click", () => { btn.disabled = true; btn.textContent = "Actualizando…"; location.reload(); });
    const x = document.createElement("button");
    x.type = "button"; x.className = "upd-x"; x.setAttribute("aria-label", "Cerrar"); x.textContent = "×";
    x.addEventListener("click", () => b.remove());
    b.append(btn, x);
    document.body.appendChild(b);
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then((reg) => {
        const buscar = () => reg.update().catch(() => {});
        const vigilar = (sw) => sw && sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) avisoActualizacion();
        });
        if (reg.waiting && navigator.serviceWorker.controller) avisoActualizacion();
        reg.addEventListener("updatefound", () => vigilar(reg.installing));
        buscar();
        document.addEventListener("visibilitychange", () => { if (!document.hidden) buscar(); });
        window.addEventListener("online", buscar);
        setInterval(buscar, 30 * 60 * 1000);
      }).catch(() => {});
    });
  }
})();
