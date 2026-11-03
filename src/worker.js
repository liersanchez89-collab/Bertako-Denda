// Punto de entrada del Worker de Cloudflare.
// - /api/checkout  → crea el pago en Stripe (src/checkout.js)
// - todo lo demás  → sirve los archivos de la carpeta public/ (la web)
import { onRequestPost } from "./checkout.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/checkout") {
      if (request.method === "POST") return onRequestPost({ request, env });
      return new Response("Método no permitido", { status: 405 });
    }

    return env.ASSETS.fetch(request);
  },
};
