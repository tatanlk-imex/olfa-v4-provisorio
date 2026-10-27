/* Asistente de cotización OLFA: preguntas básicas guiadas (sin inteligencia artificial, 100 % editable).
   Orienta al cliente, arma el resumen y lo envía por WhatsApp, formulario o correo. */
(function () {
  "use strict";
  var C = window.OLFA_CONFIG || {};
  var RAIZ = document.documentElement.getAttribute("data-raiz") || "./";
  var TEL = C.TELEFONO || "(02) 2396 4622";

  // ---------- Flujo de preguntas ----------
  // Cada opción: [texto visible, siguiente nodo, clave opcional para recomendar]
  var CANT = { q: "¿Qué cantidad aproximada necesitas?", key: "Cantidad", opts: [["Menos de 10 unidades", "tipo"], ["De 10 a 50 unidades", "tipo"], ["De 51 a 200 unidades", "tipo"], ["Más de 200 unidades", "tipo"], ["Aún no lo sé", "tipo"]] };
  var TIPO = { q: "¿Cómo compras?", key: "Tipo de cliente", opts: [["Empresa usuaria (compro para mi equipo)", "plazo"], ["Distribuidor o revendedor", "plazo"], ["Licitación o convenio", "plazo"], ["Persona natural", "plazo"]] };
  var PLAZO = { q: "¿Para cuándo lo necesitas?", key: "Plazo", opts: [["Lo antes posible", "extra"], ["Este mes", "extra"], ["En los próximos meses", "extra"], ["Solo estoy averiguando", "extra"]] };
  var RUBRO = { q: "¿En qué rubro trabaja tu empresa?", key: "Rubro", opts: [["Minería", "cant"], ["Logística, bodegas y centros de distribución", "cant"], ["Industria alimentaria", "cant"], ["Construcción e instalaciones", "cant"], ["Retail y comercio", "cant"], ["Manufactura e industria en general", "cant"], ["Otro", "cant"]] };
  var F = {
    inicio: { q: "¡Hola! Soy el asistente de OLFA Chile. Te hago unas preguntas rápidas para orientarte y que tu cotización llegue completa. ¿Qué necesitas?", key: "Necesidad", opts: [
      ["Cuchillos de seguridad para mi empresa o lugar de trabajo", "seg_tarea", "seg"], ["Cuchillos industriales (18 y 25 mm)", "ind_uso", "ind"], ["Repuestos de hojas", "rep_tipo", "rep"],
      ["Raspadores", "ras_uso", "ras"], ["Cuchillos de uso general (9 mm) u oficina", "est_uso", "est"], ["Manualidades y corte de precisión", "pre_uso", "pre"],
      ["Quiero ser distribuidor o revendedor", "dist_canal", "dist"], ["Otra consulta", "rubro", "otro"]] },
    // Seguridad
    seg_tarea: { q: "¿Qué vas a cortar principalmente?", key: "Tarea de corte", opts: [["Cajas de cartón", "rubro", "c1"], ["Film y zunchos", "rubro", "c2"], ["Cintas, sacos y bolsas", "rubro", "c3"], ["Caucho u otros materiales duros", "rubro", "c4"], ["Alimentos o envases en industria alimentaria", "rubro", "c5"], ["Varias tareas / no lo sé", "rubro", "c6"]] },
    // Industrial
    ind_uso: { q: "¿Para qué trabajo lo necesitas?", key: "Uso", opts: [["Corte pesado, con dos manos", "rubro"], ["Alfombras, pisos y revestimientos", "rubro"], ["Entornos con aceite o acetona", "rubro"], ["Cortes en zonas de difícil acceso (largo alcance)", "rubro"], ["Otro", "rubro"]] },
    // Repuestos
    rep_tipo: { q: "¿Para qué cuchillo necesitas la hoja? Escribe el modelo o el ancho (puedes escribir 'no sé').", key: "Modelo o ancho de hoja", input: "text", next: "cant", ph: "Ej.: SK-5, L-5 (18 mm), 9 mm" },
    // Raspadores
    ras_uso: { q: "¿Qué quieres raspar?", key: "Uso", opts: [["Vidrios y ventanas", "rubro"], ["Pintura, adhesivos y residuos", "rubro"], ["Pisos y paredes", "rubro"], ["Otro", "rubro"]] },
    // Estándar
    est_uso: { q: "¿Dónde lo usarás?", key: "Uso", opts: [["Oficina", "cant"], ["Ferretería y taller", "cant"], ["Hogar", "cant"], ["Otro", "cant"]] },
    // Precisión
    pre_uso: { q: "¿Qué trabajo harás?", key: "Uso", opts: [["Telas y patchwork", "cant"], ["Maquetería y papel", "cant"], ["Planchas salvacortes, reglas y sets", "cant"], ["Otro", "cant"]] },
    // Distribuidores
    dist_canal: { q: "¿Qué tipo de negocio tienes?", key: "Tipo de negocio", opts: [["Ferretería", "cant"], ["Librería o papelería", "cant"], ["Distribuidor industrial o de seguridad", "cant"], ["Tienda en línea", "cant"], ["Otro", "cant"]] },
    // Comunes
    rubro: RUBRO,
    cant: CANT,
    tipo: TIPO,
    plazo: PLAZO,
    extra: { q: "¿Algo más que debamos saber? (opcional)", key: "Comentarios", input: "text", next: "nombre", ph: "Escribe aquí o deja vacío", opcional: true },
    nombre: { q: "Para enviarte la cotización, ¿cuál es tu nombre?", key: "Nombre", input: "text", next: "empresa", ph: "Nombre y apellido" },
    empresa: { q: "¿De qué empresa o institución eres?", key: "Empresa", input: "text", next: "correo", ph: "Empresa (opcional)", opcional: true },
    correo: { q: "¿A qué correo te enviamos la cotización?", key: "Correo", input: "email", next: "fono", ph: "tucorreo@empresa.cl" },
    fono: { q: "¿Y un teléfono para coordinar? (opcional)", key: "Teléfono", input: "tel", next: "fin", ph: "+56 9 …", opcional: true }
  };

  // ---------- Orientación referencial ----------
  function recomendar(t, c) {
    if (t === "seg") {
      var s = {
        c1: ["los cuchillos de seguridad auto-retráctiles SK-4, SK-5 y SK-9, cuya hoja se retrae al soltar el material", "cuchillos-de-seguridad/"],
        c2: ["los cuchillos de máxima seguridad SK-10, SK-15 (desechable) y SK-16, diseñados para film y zunchos", "cuchillos-de-seguridad/"],
        c3: ["el SK-10 (corta cintas de embalaje y films sin dañar el contenido) y el SK-9, que además corta cinta", "cuchillos-de-seguridad/"],
        c4: ["el SK-16, que según su ficha corta film, zunchos, caucho y cajas, y la línea de cuchillos industriales", "cuchillos-de-seguridad/"],
        c5: ["la pinza PK-1 (abre bolsas y paquetes sin dañar el contenido, pensada para la industria alimentaria), el SK-12 (acero inoxidable, detectable por detectores de metales y con certificado NSF según su ficha) y el SK-15/L (NSF)", "cuchillos-de-seguridad/"],
        c6: ["nuestra línea de cuchillos de seguridad; un ejecutivo te ayuda a elegir el modelo por tarea", "cuchillos-de-seguridad/"]
      }[c.c] || ["nuestra línea de cuchillos de seguridad", "cuchillos-de-seguridad/"];
      return { txt: "Por lo que cuentas, te orientaría hacia " + s[0] + ".", ruta: s[1], etiqueta: "Ver cuchillos de seguridad" };
    }
    if (t === "ind") { return { txt: "Para trabajo industrial tenemos cuchillos de 18 y 25 mm con mango antideslizante y bloqueo de rueda o automático.", ruta: "cuchillos-industriales/", etiqueta: "Ver cuchillos industriales" }; }
    if (t === "rep") { return { txt: "Cada cuchillo indica qué repuestos usa, y cada repuesto, para qué cuchillos sirve.", ruta: "repuestos-y-hojas/", etiqueta: "Ver repuestos" }; }
    if (t === "ras") { return { txt: "Tenemos raspadores de 40 a 120 mm, con hojas de repuesto.", ruta: "raspadores/", etiqueta: "Ver raspadores" }; }
    if (t === "est") { return { txt: "Para uso general tenemos cuchillos estándar de 9 mm y de 12,5 mm.", ruta: "cuchillos-estandar/", etiqueta: "Ver cuchillos estándar" }; }
    if (t === "pre") { return { txt: "Para precisión y manualidades tenemos cuchillos tipo lápiz, rotativos, compases de corte y tijeras.", ruta: "manualidades-y-precision/", etiqueta: "Ver manualidades y precisión" }; }
    if (t === "dist") { return { txt: "Imex es el distribuidor exclusivo de OLFA en Chile. Cuéntanos tu negocio y vemos cómo trabajar juntos.", ruta: "distribuidores/", etiqueta: "Ver distribuidores" }; }
    return null;
  }
  var INTERES = { seg: "seguridad", ind: "industrial", rep: "repuestos", ras: "raspadores", est: "estandar", pre: "manualidades", dist: "distribuidor", otro: "otro" };

  // ---------- Interfaz ----------
  var raiz = document.createElement("div");
  raiz.innerHTML =
    '<button type="button" class="asesor-btn" aria-expanded="false" aria-controls="asesor-panel"><span aria-hidden="true">💬</span> ¿Te ayudo a cotizar?</button>' +
    '<section class="asesor-panel" id="asesor-panel" role="dialog" aria-label="Asistente de cotización OLFA" hidden>' +
    '<header><strong>Asistente OLFA</strong><button type="button" class="asesor-cerrar" aria-label="Cerrar asistente">×</button></header>' +
    '<div class="asesor-msgs" aria-live="polite"></div><div class="asesor-ctl"></div></section>';
  document.body.appendChild(raiz);
  var btn = raiz.querySelector(".asesor-btn"), panel = raiz.querySelector(".asesor-panel");
  var msgs = raiz.querySelector(".asesor-msgs"), ctl = raiz.querySelector(".asesor-ctl");
  var estado = null, iniciado = false;

  function nuevo() { estado = { tema: "", c: {}, resp: [], datos: {} }; }
  function burbuja(texto, tipo) {
    var d = document.createElement("div"); d.className = "asesor-b " + (tipo || "bot"); d.textContent = texto; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
  }
  function evento(n, d) { if (window.gtag) { window.gtag("event", n, d || {}); } }

  function preguntar(id) {
    var n = F[id]; if (!n) { return resumen(); }
    burbuja(n.q, "bot"); ctl.innerHTML = "";
    if (n.opts) {
      n.opts.forEach(function (o) {
        var b = document.createElement("button"); b.type = "button"; b.className = "asesor-op"; b.textContent = o[0];
        b.addEventListener("click", function () { responder(n, id, o[0], o[1], o[2]); }); ctl.appendChild(b);
      });
    } else {
      var f = document.createElement("form"); f.className = "asesor-in";
      var i = document.createElement("input"); i.type = n.input; i.placeholder = n.ph || ""; i.setAttribute("aria-label", n.q); i.autocomplete = n.input === "email" ? "email" : (id === "nombre" ? "name" : "off");
      var s = document.createElement("button"); s.type = "submit"; s.className = "asesor-env"; s.textContent = "Enviar";
      f.appendChild(i); f.appendChild(s);
      if (n.opcional) { var sk = document.createElement("button"); sk.type = "button"; sk.className = "asesor-saltar"; sk.textContent = "Saltar"; sk.addEventListener("click", function () { responder(n, id, "", n.next); }); f.appendChild(sk); }
      f.addEventListener("submit", function (e) {
        e.preventDefault(); var v = i.value.trim();
        if (!v && !n.opcional) { i.focus(); return; }
        if (n.input === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { burbuja("Revisa el correo, parece incompleto.", "bot"); i.focus(); return; }
        responder(n, id, v, n.next);
      });
      ctl.appendChild(f); i.focus();
    }
  }
  function responder(n, id, texto, sig, clave) {
    if (id === "inicio") { estado.tema = clave; }
    if (clave && id !== "inicio") { estado.c[clave.charAt(0)] = clave; }
    if (texto) { burbuja(texto, "yo"); estado.resp.push([n.key, texto]); }
    ctl.innerHTML = "";
    if (n.key === "Nombre" || n.key === "Empresa" || n.key === "Correo" || n.key === "Teléfono") { estado.datos[n.key] = texto; }
    if (estado.tema === "dist" && sig === "tipo") { sig = "plazo"; } // el distribuidor ya indicó su tipo de cliente
    setTimeout(function () { sig === "fin" ? resumen() : preguntar(sig); }, 250);
  }
  function textoResumen() {
    var l = ["Hola, soy " + (estado.datos["Nombre"] || "") + (estado.datos["Empresa"] ? " (" + estado.datos["Empresa"] + ")" : "") + ". Quiero cotizar con OLFA Chile:"];
    estado.resp.forEach(function (r) { if (["Nombre", "Empresa", "Correo", "Teléfono"].indexOf(r[0]) < 0) { l.push("• " + r[0] + ": " + r[1]); } });
    var rc = recomendar(estado.tema, estado.c); if (rc) { l.push("• Orientación del asistente: " + rc.txt); }
    l.push("Correo: " + (estado.datos["Correo"] || "-")); l.push("Teléfono: " + (estado.datos["Teléfono"] || "-"));
    return l.join("\n");
  }
  function resumen() {
    var rc = recomendar(estado.tema, estado.c);
    burbuja("¡Gracias, " + (estado.datos["Nombre"] || "") + "! Esto es lo que entendí:", "bot");
    burbuja(textoResumen().split("\n").slice(1).join("\n"), "bot");
    if (rc) {
      var d = burbuja(rc.txt + " ", "bot"); var a = document.createElement("a"); a.href = RAIZ + rc.ruta; a.textContent = rc.etiqueta; d.appendChild(a);
    }
    ctl.innerHTML = "";
    var lab = document.createElement("label"); lab.className = "asesor-acepto";
    lab.innerHTML = '<input type="checkbox"> <span>Acepto que Imex use estos datos para responder mi solicitud (<a href="' + RAIZ + 'politica-de-privacidad/">política de privacidad</a>).</span>';
    ctl.appendChild(lab); var chk = lab.querySelector("input");
    function exigir() { if (!chk.checked) { burbuja("Para enviar necesito que aceptes el uso de tus datos.", "bot"); chk.focus(); return false; } return true; }
    if (C.WHATSAPP && C.ASISTENTE_WHATSAPP) {
      var w = document.createElement("a"); w.className = "btn btn-wsp asesor-enviar"; w.href = "#"; w.innerHTML = '<span>Enviar por WhatsApp</span>';
      w.addEventListener("click", function (e) { e.preventDefault(); if (!exigir()) { return; } evento("asistente_whatsapp", { tema: estado.tema }); window.open("https://wa.me/" + C.WHATSAPP + "?text=" + encodeURIComponent(textoResumen()), "_blank", "noopener"); fin(); });
      ctl.appendChild(w);
    }
    var m = document.createElement("button"); m.type = "button"; m.className = "btn btn-sec asesor-enviar"; m.textContent = C.FORM_ENDPOINT ? "Enviar solicitud" : "Abrir mi correo con la consulta";
    m.addEventListener("click", function () { if (!exigir()) { return; } evento("asistente_correo", { tema: estado.tema }); enviarCorreo(); });
    ctl.appendChild(m);
  }
  function fin() { burbuja("¡Listo! Un ejecutivo te contactará para confirmar el modelo y enviarte la cotización. Si es urgente, llámanos al " + TEL + ".", "bot"); }
  function enviarCorreo() {
    var d = { nombre: estado.datos["Nombre"], empresa: estado.datos["Empresa"] || "", correo: estado.datos["Correo"], telefono: estado.datos["Teléfono"] || "", interes: INTERES[estado.tema] || "otro", producto: "", mensaje: textoResumen(), pagina: location.href, origen: "asistente" };
    if (C.FORM_ENDPOINT) {
      fetch(C.FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(d) })
        .then(function (r) { if (!r.ok) { throw new Error(); } ctl.innerHTML = ""; fin(); })
        .catch(function () { burbuja("No pudimos enviar la solicitud. Escríbenos a " + C.CORREO_COTIZACIONES + " o llama al " + TEL + ".", "bot"); });
    } else {
      window.location.href = "mailto:" + C.CORREO_COTIZACIONES + "?subject=" + encodeURIComponent("Cotización web OLFA (asistente): " + (INTERES[estado.tema] || "consulta")) + "&body=" + encodeURIComponent(textoResumen());
      ctl.innerHTML = "";
      burbuja("Se abrió tu programa de correo con la consulta lista. No se envía nada hasta que presiones Enviar. Si no se abrió, escríbenos a " + C.CORREO_COTIZACIONES + " o llama al " + TEL + ".", "bot");
    }
  }
  function abrir() {
    panel.hidden = false; btn.setAttribute("aria-expanded", "true"); btn.hidden = true;
    if (!iniciado) { iniciado = true; nuevo(); preguntar("inicio"); evento("asistente_abierto"); }
  }
  function cerrar() { panel.hidden = true; btn.hidden = false; btn.setAttribute("aria-expanded", "false"); btn.focus(); }
  btn.addEventListener("click", abrir);
  raiz.querySelector(".asesor-cerrar").addEventListener("click", cerrar);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { cerrar(); } });
})();
