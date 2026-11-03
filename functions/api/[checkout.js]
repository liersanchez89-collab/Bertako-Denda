// Cloudflare Pages Function → responde en https://tu-web/api/checkout
// Recibe el carrito, comprueba precios en productos.json (nunca nos fiamos del navegador)
// y crea una sesión de pago en Stripe. Devuelve la URL de la página de pago.
//
// Necesita UNA variable secreta en Cloudflare: STRIPE_SECRET_KEY (sk_test_... para pruebas, sk_live_... para vender)

const ENVIO_GRATIS_DESDE = 40;  // €
const COSTE_ENVIO = 4.95;       // €

export async function onRequestPost({ request, env }) {
  try {
    if (!env.STRIPE_SECRET_KEY) return json({ error: "Falta configurar STRIPE_SECRET_KEY" }, 500);

    const { items } = await request.json();
    if (!Array.isArray(items) || !items.length) return json({ error: "El carrito está vacío" }, 400);

    // Leemos el catálogo desde nuestra propia web
    const origen = new URL(request.url).origin;
    const catalogo = await (await env.ASSETS.fetch(new URL("/productos.json", origen))).json();

    const params = new URLSearchParams();
    let subtotal = 0;
    let soloRecogida = false;

    items.forEach((item, i) => {
      const p = catalogo.find((x) => x.id === item.id && x.disponible !== false);
      const cantidad = Math.max(1, Math.min(20, parseInt(item.cantidad, 10) || 1));
      if (!p) throw new Error(`Producto no disponible: ${item.id}`);
      if (p.envio === false) soloRecogida = true;
      subtotal += p.precio * cantidad;

      params.append(`line_items[${i}][quantity]`, cantidad);
      params.append(`line_items[${i}][price_data][currency]`, "eur");
      params.append(`line_items[${i}][price_data][unit_amount]`, Math.round(p.precio * 100));
      params.append(`line_items[${i}][price_data][product_data][name]`, `${p.nombre} · ${p.formato}`);
    });

    // Opciones de entrega
    const opciones = [];
    opciones.push({ nombre: "Recogida en mano (mercadillo u Oñati)", precio: 0, min: 1, max: 7 });
    if (!soloRecogida) {
      const precio = subtotal >= ENVIO_GRATIS_DESDE ? 0 : COSTE_ENVIO;
      opciones.unshift({ nombre: precio ? "Envío a domicilio (península)" : "Envío a domicilio gratis", precio, min: 2, max: 4 });
    }
    opciones.forEach((o, i) => {
      const k = `shipping_options[${i}][shipping_rate_data]`;
      params.append(`${k}[type]`, "fixed_amount");
      params.append(`${k}[display_name]`, o.nombre);
      params.append(`${k}[fixed_amount][amount]`, Math.round(o.precio * 100));
      params.append(`${k}[fixed_amount][currency]`, "eur");
      params.append(`${k}[delivery_estimate][minimum][unit]`, "business_day");
      params.append(`${k}[delivery_estimate][minimum][value]`, o.min);
      params.append(`${k}[delivery_estimate][maximum][unit]`, "business_day");
      params.append(`${k}[delivery_estimate][maximum][value]`, o.max);
    });

    params.append("mode", "payment");
    params.append("locale", "es");
    params.append("shipping_address_collection[allowed_countries][0]", "ES");
    params.append("phone_number_collection[enabled]", "true");
    params.append("success_url", `${origen}/gracias.html?pedido={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${origen}/#productos`);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const sesion = await res.json();
    if (!res.ok) return json({ error: sesion.error?.message || "Error de Stripe" }, 502);

    return json({ url: sesion.url });
  } catch (e) {
    return json({ error: e.message }, 400);
  }
}

function json(datos, status = 200) {
  return new Response(JSON.stringify(datos), { status, headers: { "Content-Type": "application/json" } });
}
