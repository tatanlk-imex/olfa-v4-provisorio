/* OLFA Chile - comportamiento mínimo. El sitio funciona completo sin JavaScript (salvo filtros y envío del formulario). */
(function () {
  "use strict";
  var C = window.OLFA_CONFIG || {};
  var RAIZ = document.documentElement.getAttribute("data-raiz") || "./";

  // Menú móvil
  var btn = document.querySelector(".btn-menu");
  var nav = document.getElementById("menu-principal");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var abierto = nav.classList.toggle("abierto");
      btn.setAttribute("aria-expanded", abierto ? "true" : "false");
    });
  }

  // WhatsApp (solo si está configurado)
  if (C.WHATSAPP) {
    document.querySelectorAll("[data-whatsapp]").forEach(function (a) {
      var texto = a.getAttribute("data-whatsapp") || "Hola, quiero cotizar productos OLFA.";
      a.href = "https://wa.me/" + C.WHATSAPP + "?text=" + encodeURIComponent(texto) + "&lang=es";
      if (a.hasAttribute("data-wsp-num")) {
        var n = String(C.WHATSAPP);
        a.textContent = "+" + n.slice(0, 2) + " " + n.slice(2, 3) + " " + n.slice(3, 7) + " " + n.slice(7);
        var fila = a.closest("[data-wsp-fila]");
        if (fila) { fila.hidden = false; }
      }
      a.hidden = false;
    });
  }

  // Google Analytics (solo si está configurado)
  if (C.GA4_ID) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(C.GA4_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", C.GA4_ID);
  }
  function evento(nombre, datos) { if (window.gtag) { window.gtag("event", nombre, datos || {}); } }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a) { return; }
    var h = a.getAttribute("href") || "";
    if (h.indexOf("tel:") === 0) { evento("llamar", { numero: h }); }
    if (h.indexOf("wa.me") > -1) { evento("whatsapp"); }
    if (h.indexOf("cotizar") > -1) { evento("clic_cotizar", { destino: h }); }
  });

  // Autodiagnóstico de control del riesgo de corte
  var diag = document.getElementById("form-autodiagnostico");
  if (diag) {
    var pend = {
      p1: "Incluir el riesgo de corte con herramientas manuales en la matriz de identificación de peligros y evaluación de riesgos (IPER).",
      p2: "Definir qué cuchillo se usa en cada tarea de corte y retirar los cuchillos de hoja fija expuesta donde exista una alternativa más segura.",
      p3: "Reemplazar el cuchillo de hoja expuesta por uno de hoja retráctil o protegida en las tareas de apertura de cajas, film y zunchos.",
      p4: "Contar con un contenedor para desechar hojas usadas, de modo que no queden sueltas en bolsillos ni en el basurero común.",
      p5: "Capacitar a quienes cortan en el uso correcto, el cambio de hoja y la posición de la mano (nunca en la línea de corte).",
      p6: "Registrar los incidentes por corte y revisar un indicador simple cada mes (por ejemplo, cortes cada 100 trabajadores)."
    };
    diag.addEventListener("submit", function (e) {
      e.preventDefault();
      var puntos = 0, faltan = [], sin = 0;
      Object.keys(pend).forEach(function (k) {
        var s = diag.querySelector("input[name=" + k + "]:checked");
        if (!s) { sin++; return; }
        if (s.value === "si") { puntos++; } else { faltan.push(pend[k]); }
      });
      var res = document.getElementById("diag-resultado");
      if (sin) { res.hidden = false; res.className = "resultado"; res.innerHTML = "<p><strong>Responde las 6 preguntas</strong> para ver tu resultado (te faltan " + sin + ").</p>"; return; }
      var nivel = puntos >= 5 ? ["bien", "Buen control del riesgo de corte"] : (puntos >= 3 ? ["", "Hay brechas que conviene cerrar"] : ["", "El riesgo de corte está poco controlado"]);
      var html = "<h3>" + nivel[1] + " (" + puntos + " de 6)</h3>";
      if (faltan.length) { html += "<p>Puntos por resolver:</p><ul>" + faltan.map(function (f) { return "<li>" + f + "</li>"; }).join("") + "</ul>"; }
      var msg = "Autodiagnóstico de seguridad en el corte: " + puntos + "/6. Pendientes: " + (faltan.join(" | ") || "ninguno");
      html += '<p><a class="btn" href="' + RAIZ + 'cotizar/?interes=seguridad&msg=' + encodeURIComponent(msg) + '">Pedir cotización con mi resultado</a></p>';
      html += '<p>Resultado orientativo; no reemplaza la evaluación de tu prevencionista de riesgos ni la matriz IPER de tu empresa.</p>';
      res.className = "resultado " + nivel[0]; res.innerHTML = html; res.hidden = false; res.scrollIntoView({ behavior: "smooth", block: "nearest" });
      evento("autodiagnostico_corte", { puntos: puntos });
    });
  }

  // Videos de YouTube: no se carga nada de YouTube hasta que la persona hace clic (sin JavaScript queda el enlace al video)
  document.querySelectorAll(".video-lite[data-yt]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var id = a.getAttribute("data-yt");
      var cont = document.createElement("div");
      cont.className = "video-marco";
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
      f.title = a.querySelector(".video-tit") ? a.querySelector(".video-tit").textContent : "Video OLFA";
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      cont.appendChild(f);
      a.parentNode.replaceChild(cont, a);
      evento("video_visto", { video_id: id });
    });
  });

  // Carrusel del home: rota solo si la persona no pidió menos movimiento; se pausa con el mouse, el foco o el botón
  var car = document.querySelector(".carrusel");
  if (car) {
    var slides = Array.prototype.slice.call(car.querySelectorAll(".slide")), ctl = car.querySelector(".carrusel-ctl"), actual = 0, pausado = false, tm = null;
    slides.forEach(function (s) { var im = s.querySelector("img"); if (im) { im.loading = "eager"; } });
    var mostrar = function (i) { actual = (i + slides.length) % slides.length; slides.forEach(function (s, k) { s.hidden = k !== actual; }); };
    var siguiente = function () { mostrar(actual + 1); };
    var arrancar = function () { if (tm) { clearInterval(tm); } if (!pausado && !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) { tm = setInterval(siguiente, 6000); } };
    if (ctl && slides.length > 1) {
      ctl.hidden = false;
      ctl.querySelector("[data-prev]").addEventListener("click", function () { mostrar(actual - 1); arrancar(); });
      ctl.querySelector("[data-sig]").addEventListener("click", function () { siguiente(); arrancar(); });
      var bp = ctl.querySelector("[data-pausa]");
      bp.addEventListener("click", function () { pausado = !pausado; bp.setAttribute("aria-pressed", pausado ? "true" : "false"); bp.textContent = pausado ? "▶" : "❚❚"; bp.setAttribute("aria-label", pausado ? "Reanudar" : "Pausar"); arrancar(); });
      car.addEventListener("mouseenter", function () { if (tm) { clearInterval(tm); } });
      car.addEventListener("mouseleave", arrancar);
      car.addEventListener("focusin", function () { if (tm) { clearInterval(tm); } });
      arrancar();
    }
  }

  // Galería de producto
  var principal = document.querySelector(".galeria .principal img");
  document.querySelectorAll(".galeria .miniaturas button").forEach(function (b) {
    b.addEventListener("click", function () {
      if (principal) { principal.src = b.getAttribute("data-src"); }
      document.querySelectorAll(".galeria .miniaturas button").forEach(function (x) { x.removeAttribute("aria-current"); });
      b.setAttribute("aria-current", "true");
    });
  });

  // Catálogo con filtros
  var cont = document.getElementById("catalogo");
  if (cont) {
    var tarjetas = Array.prototype.slice.call(cont.querySelectorAll("[data-linea]"));
    var cuenta = document.getElementById("contador");
    var texto = document.getElementById("filtro-texto");
    var chips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-linea-filtro]"));
    var ancho = document.getElementById("filtro-ancho");
    var sinResultados = document.getElementById("sin-resultados");
    var estado = { linea: "todos", q: "", ancho: "" };
    function norm(t) { return (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
    function aplicar() {
      var n = 0;
      tarjetas.forEach(function (t) {
        var ok = (estado.linea === "todos" || t.getAttribute("data-linea") === estado.linea) &&
          (!estado.ancho || t.getAttribute("data-ancho") === estado.ancho) &&
          (!estado.q || norm(t.getAttribute("data-busqueda")).indexOf(norm(estado.q)) > -1);
        t.hidden = !ok;
        if (ok) { n++; }
      });
      if (cuenta) { cuenta.textContent = n + (n === 1 ? " producto" : " productos"); }
      if (sinResultados) { sinResultados.hidden = n !== 0; }
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        chips.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        c.setAttribute("aria-pressed", "true");
        estado.linea = c.getAttribute("data-linea-filtro");
        aplicar();
      });
    });
    if (texto) { texto.addEventListener("input", function () { estado.q = texto.value; aplicar(); }); }
    if (ancho) { ancho.addEventListener("change", function () { estado.ancho = ancho.value; aplicar(); }); }
    var qs = new URLSearchParams(window.location.search);
    if (qs.get("q") && texto) { texto.value = qs.get("q"); estado.q = qs.get("q"); }
    var lin = qs.get("linea");
    if (lin) {
      var chip = chips.filter(function (c) { return c.getAttribute("data-linea-filtro") === lin; })[0];
      if (chip) { chip.click(); }
    }
    aplicar();
  }

  // Buscador de puntos de venta (solo existe si la página trae el listado)
  var loc = document.getElementById("locales");
  if (loc) {
    var lt = Array.prototype.slice.call(loc.querySelectorAll("[data-region]"));
    var lc = document.getElementById("loc-contador"), lx = document.getElementById("loc-texto"), lr = document.getElementById("loc-region"), lv = document.getElementById("loc-vacio");
    var lchips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-tipo-filtro]"));
    var lcom = document.getElementById("loc-comuna");
    var le = { tipo: "todos", q: "", region: "", comuna: "" };
    var normL = function (t) { return (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    var aplicarL = function () {
      var n = 0;
      lt.forEach(function (t) {
        var ok = (le.tipo === "todos" || t.getAttribute("data-tipo") === le.tipo) && (!le.region || t.getAttribute("data-region") === le.region) && (!le.comuna || t.getAttribute("data-comuna") === le.comuna) &&
          (!le.q || normL(t.getAttribute("data-busqueda")).indexOf(normL(le.q)) > -1);
        t.hidden = !ok; if (ok) { n++; }
      });
      if (lc) { lc.textContent = n + (n === 1 ? " local" : " locales"); }
      if (lv) { lv.hidden = n !== 0; }
    };
    lchips.forEach(function (c) { c.addEventListener("click", function () { lchips.forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); c.setAttribute("aria-pressed", "true"); le.tipo = c.getAttribute("data-tipo-filtro"); aplicarL(); }); });
    if (lx) { lx.addEventListener("input", function () { le.q = lx.value; aplicarL(); }); }
    if (lr) { lr.addEventListener("change", function () {
      le.region = lr.value; le.comuna = "";
      if (lcom) { lcom.value = ""; Array.prototype.forEach.call(lcom.options, function (o) { o.hidden = !!(o.value && le.region && o.getAttribute("data-region") !== le.region); }); }
      aplicarL(); }); }
    if (lcom) { lcom.addEventListener("change", function () { le.comuna = lcom.value; aplicarL(); }); }
    aplicarL();
  }

  // Formulario (cotizar, agendar visita, distribuidor): abre el correo con lo que la persona escribió; no se envía nada solo
  var form = document.getElementById("form-cotizacion");
  if (form) {
    var qs2 = new URLSearchParams(window.location.search);
    var items = [];
    (qs2.get("lista") || "").split("~").forEach(function (t) { var p = t.split("*"); if (p[0]) { items.push({ sku: p[0], n: Math.max(1, parseInt(p[1], 10) || 1) }); } });
    var eq = qs2.get("producto"), interes = qs2.get("interes");
    if (eq && form.elements.producto) { form.elements.producto.value = eq; }
    var ie = form.elements.interes;
    if (interes && ie && ie.type !== "hidden") { ie.value = interes; }
    var pm = qs2.get("msg");
    if (pm && form.elements.mensaje) { form.elements.mensaje.value = pm; }
    var resumen = document.getElementById("resumen-lista");
    if (items.length && resumen) {
      resumen.innerHTML = "<h2>Tu cotización</h2><ul class=\"lista-resumen\">" + items.map(function (i) { return "<li><strong>" + i.sku + "</strong>: " + i.n + (i.n === 1 ? " unidad" : " unidades") + "</li>"; }).join("") + "</ul><p><a href=\"" + RAIZ + "mi-cotizacion/\">Modificar productos o cantidades</a></p>";
      resumen.hidden = false;
      if (form.elements.producto && form.elements.producto.closest) { var cp = form.elements.producto.closest(".campo"); if (cp) { cp.hidden = true; } }
      var cc = document.getElementById("campo-cantidad"); if (cc) { cc.hidden = true; }
    }
    var msg = document.getElementById("form-mensaje");
    function aviso(clase, texto) { msg.className = "aviso " + clase; msg.textContent = texto; msg.hidden = false; msg.focus(); }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements.sitio_web && form.elements.sitio_web.value) { return; } // trampa para robots
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var datos = {}, lineas = [];
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.type === "checkbox" || el.name === "sitio_web" || el.name === "interes") { return; }
        if (items.length && (el.name === "producto" || el.name === "cantidad")) { return; }
        var val = (el.value || "").trim(); if (!val) { return; }
        var lab = el.id ? form.querySelector("label[for=\"" + el.id + "\"]") : null;
        var rot = lab ? lab.textContent.replace(/\s*\*\s*$/, "").trim() : el.name;
        datos[el.name] = val; lineas.push(rot + ": " + val);
      });
      var itx = ie ? (ie.tagName === "SELECT" ? ie.options[ie.selectedIndex].text : (ie.getAttribute("data-texto") || ie.value)) : "";
      if (items.length) { itx = "Cotización de productos"; datos.productos = items; }
      datos.interes = itx; datos.pagina = window.location.origin + window.location.pathname;
      evento("enviar_cotizacion", { interes: itx });
      var variante = form.getAttribute("data-variante");
      var cuerpo = (itx ? "Solicitud: " + itx + "\n\n" : "") + lineas.join("\n");
      if (items.length) { cuerpo += "\n\nProductos y cantidades:\n" + items.map(function (i) { return "- " + i.sku + ": " + i.n + (i.n === 1 ? " unidad" : " unidades"); }).join("\n"); }
      cuerpo += "\n\nEnviado desde el sitio web OLFA Chile (" + datos.pagina + ")";
      var asunto = variante === "visita" ? "Solicitud de visita o reunión online OLFA" : variante === "distribuidor" ? "Quiero ser distribuidor OLFA: " + (datos.empresa || datos.nombre || "") :
        "Cotización web OLFA: " + (items.length ? (items.length <= 3 ? items.map(function (i) { return i.sku; }).join(", ") : items.length + " productos") : (datos.producto || itx || "consulta"));
      if (C.FORM_ENDPOINT) {
        fetch(C.FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(datos) })
          .then(function (r) { if (!r.ok) { throw new Error("fallo"); } form.reset(); aviso("aviso-ok", "¡Gracias! Recibimos tu solicitud. Te responderemos dentro del horario de atención."); })
          .catch(function () { aviso("aviso-error", "No pudimos enviar el formulario. Escríbenos a " + C.CORREO_COTIZACIONES + " o llama al " + C.TELEFONO + "."); });
      } else {
        window.location.href = "mailto:" + C.CORREO_COTIZACIONES + "?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(cuerpo);
        aviso("aviso-ok", "Se abrió tu programa de correo con la solicitud lista. Solo debes presionar Enviar. Si no se abrió, escríbenos a " + C.CORREO_COTIZACIONES + ".");
      }
    });
  }
})();
