# Tienda Bertako

Web de venta online de Bertako. Gratis de mantener: código en GitHub, web en Cloudflare (Workers), cobros con Stripe.
Cada cambio que se guarda en GitHub se publica solo en la web en 1–2 minutos.

## Qué hay en cada carpeta

| Archivo | Para qué sirve | ¿Lo tocáis? |
|---|---|---|
| `public/productos.json` | El catálogo: packs y sueltos (`tipo`), precio, foto y si lleva envío incluido (`envioIncluido`) | **Sí, a menudo** |
| `public/` (fotos .svg/.jpg) | Fotos de los productos | Sí |
| `public/index.html` | Textos de la página (portada, envíos, pie) | A veces |
| `public/styles.css` | Colores y diseño | Poco |
| `public/tienda.js` | El carrito | Casi nunca |
| `public/gracias.html` | Página que ve el cliente después de pagar | A veces |
| `src/checkout.js` | Habla con Stripe para cobrar (corre en Cloudflare, no en el navegador) | Solo para cambiar tarifas de envío |
| `src/worker.js` | Reparte: `/api/checkout` va al pago, lo demás a la web | No |
| `wrangler.jsonc` | Configuración de Cloudflare | No |

## Añadir un producto

1. Sube la foto a `public/` (cuadrada, mínimo 800×800, en .jpg o .webp).
2. En `public/productos.json` copia un bloque `{ ... }`, pégalo detrás de una coma y cambia los datos.
   - `id`: sin espacios ni tildes, único (ej. `miel-brezo`).
   - `precio`: con punto, no coma (`7.50`).
   - `tipo`: `pack` o `suelto` (decide en qué sección aparece).
   - `envioIncluido`: `true` si se puede enviar a casa gratis; `false` si es solo recogida en mano.
   - `destacado`: opcional, pone una etiqueta como "Recomendado".
   - `disponible`: `false` para ocultarlo sin borrarlo (agotado).
3. Guarda el cambio en GitHub. En 1 minuto está en la web.

## Envíos

- Los productos con `"envioIncluido": true` (packs Gosaria, Oleta y Familia) se envían gratis a domicilio.
- Si el carrito lleva al menos uno, todo el pedido puede enviarse. Si no, solo se ofrece recogida en mano.
- La regla está en `src/checkout.js` (lo que se cobra) y en `public/tienda.js` (el texto del carrito).

## Publicar (resumen)

1. El repositorio está conectado a un Worker de Cloudflare llamado `bertako-denda` (Workers & Pages).
2. En Stripe, copiar la clave secreta (empieza por `sk_test_` en pruebas).
3. En Cloudflare → bertako-denda → Settings → Variables and Secrets → Add → tipo **Secret**, nombre `STRIPE_SECRET_KEY`.
4. Probar con la tarjeta de pruebas `4242 4242 4242 4242`. Cuando todo vaya bien, cambiar a la clave `sk_live_`.

**Nunca** pongáis la clave secreta de Stripe dentro de un archivo del repositorio.
