# Tienda Bertako

Web de venta online de Bertako. Gratis de mantener: código en GitHub, web en Cloudflare Pages, cobros con Stripe.

## Qué hay en cada carpeta

| Archivo | Para qué sirve | ¿Lo tocáis? |
|---|---|---|
| `productos.json` | El catálogo: nombre, precio, foto, si se envía o no | **Sí, a menudo** |
| `img/productos/` | Fotos de los productos | Sí |
| `index.html` | Textos de la página (portada, envíos, pie) | A veces |
| `css/styles.css` | Colores y diseño | Poco |
| `js/tienda.js` | El carrito | Casi nunca |
| `functions/api/checkout.js` | Habla con Stripe para cobrar (corre en Cloudflare, no en el navegador) | Solo para cambiar tarifas de envío |
| `gracias.html` | Página que ve el cliente después de pagar | A veces |

## Añadir un producto

1. Sube la foto a `img/productos/` (cuadrada, mínimo 800×800, en .jpg o .webp).
2. En `productos.json` copia un bloque `{ ... }`, pégalo detrás de una coma y cambia los datos.
   - `id`: sin espacios ni tildes, único (ej. `miel-brezo`).
   - `precio`: con punto, no coma (`7.50`).
   - `envio`: `false` si solo se vende en mano (frescos).
   - `disponible`: `false` para ocultarlo sin borrarlo (agotado).
3. Guarda el cambio en GitHub. En 1 minuto está en la web.

## Envíos

Tarifas en dos sitios (mantenedlos iguales): arriba de `js/tienda.js` (lo que se enseña) y arriba de `functions/api/checkout.js` (lo que se cobra de verdad).

## Publicar (resumen)

1. Subir esta carpeta a un repositorio de GitHub.
2. Cloudflare → Workers & Pages → Create → Pages → conectar el repositorio. Sin comando de build, carpeta de salida `/`.
3. En Stripe, copiar la clave secreta (empieza por `sk_test_` en pruebas) y en Cloudflare → Settings → Variables and secrets añadir `STRIPE_SECRET_KEY` como **Secret**.
4. Probar con la tarjeta de pruebas `4242 4242 4242 4242`. Cuando todo vaya bien, cambiar a la clave `sk_live_`.

**Nunca** pongáis la clave secreta de Stripe dentro de un archivo del repositorio.
