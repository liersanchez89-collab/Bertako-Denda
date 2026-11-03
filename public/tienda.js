// Bertako — lógica de la tienda
// 1) Carga productos.json  2) Pinta las tarjetas  3) Gestiona el carrito
// 4) Al pagar, pide a /api/checkout (función de Cloudflare) un enlace de pago de Stripe.

// Envíos: los packs con "envioIncluido": true se envían a casa gratis (península).
// Si el carrito lleva al menos uno, todo el pedido viaja con él. Si no, solo recogida en mano.

const euros = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
const $ = (sel) => document.querySelector(sel);

let productos = [];
let carrito = leerCarrito(); // { idProducto: cantidad }

function leerCarrito() {
  try { return JSON.parse(localStorage.getItem("bertako-carrito")) || {}; } catch { return {}; }
}
function guardarCarrito() {
  try { localStorage.setItem("bertako-carrito", JSON.stringify(carrito)); } catch {}
}

async function cargarProductos() {
  if (window.BERTAKO_PRODUCTOS) return window.BERTAKO_PRODUCTOS; // usado en la vista previa
  const res = await fetch("productos.json", { cache: "no-store" });
  return res.json();
}

function tarjeta(p) {
  const art = document.createElement("article");
  art.className = "producto" + (p.destacado ? " destacado" : "");
  const chip = p.envioIncluido
    ? `<span class="chip ok">Envío incluido</span>`
    : `<span class="chip">Solo recogida en mano</span>`;
  art.innerHTML = `
    ${p.destacado ? `<span class="cinta">${p.destacado}</span>` : ""}
    <img src="${p.imagen}" alt="${p.nombre}: ${p.formato}" loading="lazy" width="400" height="400">
    <div class="cuerpo">
      <span class="formato">${p.formato}</span>
      <h3>${p.nombre}</h3>
      <p class="desc">${p.descripcion}</p>
      <span class="origen">${p.productor} · ${p.origen}</span>
      ${chip}
      <div class="pie">
        <span class="precio">${euros(p.precio)}</span>
        <button class="boton-anadir" type="button" data-id="${p.id}">Añadir</button>
      </div>
    </div>`;
  return art;
}

function pintarProductos() {
  const visibles = productos.filter((p) => p.disponible !== false);
  const packs = $("#rejilla-packs"), sueltos = $("#rejilla");
  packs.innerHTML = ""; sueltos.innerHTML = "";
  visibles.filter((p) => p.tipo === "pack").forEach((p) => packs.appendChild(tarjeta(p)));
  visibles.filter((p) => p.tipo !== "pack").forEach((p) => sueltos.appendChild(tarjeta(p)));
}

function anadir(id) {
  carrito[id] = (carrito[id] || 0) + 1;
  guardarCarrito();
  pintarCarrito();
  const b = $("#abrir-carrito");
  b.classList.remove("salto"); void b.offsetWidth; b.classList.add("salto");
}
function cambiar(id, delta) {
  carrito[id] = (carrito[id] || 0) + delta;
  if (carrito[id] <= 0) delete carrito[id];
  guardarCarrito();
  pintarCarrito();
}

function lineasCarrito() {
  return Object.entries(carrito)
    .map(([id, cantidad]) => ({ producto: productos.find((p) => p.id === id), cantidad }))
    .filter((l) => l.producto);
}

function pintarCarrito() {
  const lineas = lineasCarrito();
  const unidades = lineas.reduce((s, l) => s + l.cantidad, 0);
  const subtotal = lineas.reduce((s, l) => s + l.cantidad * l.producto.precio, 0);
  const conEnvio = lineas.some((l) => l.producto.envioIncluido);

  $("#contador").textContent = unidades;
  $("#contador").hidden = unidades === 0;
  const cont = $("#lineas");

  if (!lineas.length) {
    cont.innerHTML = `<p class="vacio">Tu carrito está vacío.</p>`;
  } else {
    cont.innerHTML = lineas.map(({ producto: p, cantidad }) => `
      <div class="linea">
        <img src="${p.imagen}" alt="">
        <div>
          <div class="nombre">${p.nombre}</div>
          <div class="sub">${p.formato} · ${euros(p.precio)}</div>
          <div class="cantidad">
            <button type="button" aria-label="Quitar uno" data-menos="${p.id}">−</button>
            <span>${cantidad}</span>
            <button type="button" aria-label="Añadir uno" data-mas="${p.id}">+</button>
          </div>
        </div>
        <span class="importe">${euros(p.precio * cantidad)}</span>
      </div>`).join("");
  }

  $("#subtotal").textContent = euros(subtotal);
  let notaEnvio = "";
  if (lineas.length && conEnvio) notaEnvio = "Envío a casa incluido (península). Al pagar también puedes elegir recogida en mano.";
  else if (lineas.length) notaEnvio = "Este pedido es para recogida en mano. Si quieres que te lo enviemos a casa, añade uno de los packs con envío incluido.";
  $("#nota-envio").textContent = notaEnvio;
  $("#pagar").disabled = !lineas.length;
  $("#mensaje").hidden = true;
}

function abrirCarrito() { $("#panel").hidden = false; $("#velo").hidden = false; $("#cerrar").focus(); }
function cerrarCarrito() { $("#panel").hidden = true; $("#velo").hidden = true; }

async function pagar() {
  const boton = $("#pagar");
  const msg = $("#mensaje");
  boton.disabled = true;
  boton.textContent = "Abriendo el pago…";
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lineasCarrito().map((l) => ({ id: l.producto.id, cantidad: l.cantidad })) }),
    });
    const datos = await res.json().catch(() => ({}));
    if (!res.ok || !datos.url) throw new Error(datos.error || "sin-servidor");
    window.location.href = datos.url; // nos vamos a la página de pago segura de Stripe
  } catch (e) {
    msg.textContent = e.message === "sin-servidor" || e.message === "Failed to fetch"
      ? "Vista previa: el pago todavía no está conectado. Cuando publiquemos la web con Stripe, este botón llevará a la página de pago."
      : `No se ha podido abrir el pago: ${e.message}. Inténtalo de nuevo en un momento.`;
    msg.hidden = false;
    boton.disabled = false;
    boton.textContent = "Pagar";
  }
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.dataset.id) {
    anadir(t.dataset.id);
    t.textContent = "Añadido ✓"; t.classList.add("hecho");
    setTimeout(() => { t.textContent = "Añadir"; t.classList.remove("hecho"); }, 1200);
  }
  if (t.dataset.mas) cambiar(t.dataset.mas, +1);
  if (t.dataset.menos) cambiar(t.dataset.menos, -1);
});
$("#abrir-carrito").addEventListener("click", abrirCarrito);
$("#cerrar").addEventListener("click", cerrarCarrito);
$("#velo").addEventListener("click", cerrarCarrito);
$("#pagar").addEventListener("click", pagar);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarCarrito(); });

cargarProductos().then((lista) => {
  productos = lista;
  pintarProductos();
  pintarCarrito();
}).catch(() => {
  $("#rejilla-packs").innerHTML = `<p class="vacio">No se han podido cargar los productos. Recarga la página.</p>`;
});
