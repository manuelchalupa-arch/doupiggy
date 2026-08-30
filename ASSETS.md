# Assets de DouPiggy — especificación

Todas las imágenes se importan desde un único punto: `src/assets/index.js`.
Si reemplazás un archivo por tu arte final, **respetá el nombre exacto** y no
hace falta tocar ningún componente.

Ahora mismo cada carpeta tiene un placeholder generado automáticamente (con
la paleta de la marca y una etiqueta) para que el proyecto compile y se vea
completo mientras llega el arte definitivo. Reemplazalos 1 a 1.

## `branding/`

| Archivo | Tamaño sugerido | Formato | Dónde se usa |
|---|---|---|---|
| `logo.webp` | 512×512, fondo transparente | WEBP | Splash (aro central) e ícono de marca en Información |
| `splash.webp` | 750×1334 (proporción de pantalla de celular) | WEBP | Fondo de pantalla completa del splash |
| `favicon.ico` | 16/32/48/64 multi-tamaño | ICO | Pestaña del navegador (`index.html`) |

## `backgrounds/`

| Archivo | Tamaño sugerido | Dónde se usa |
|---|---|---|
| `bg-level1.webp` | 750×1334 | Fondo de Inicio — saldo "debe bastante" |
| `bg-level2.webp` | 750×1334 | Fondo de Inicio — saldo "debe un poco" |
| `bg-level3.webp` | 750×1334 | Fondo de Inicio — saldo "a mano" |
| `bg-level4.webp` | 750×1334 | Fondo de Inicio — saldo "le deben un poco" |
| `bg-level5.webp` | 750×1334 | Fondo de Inicio — saldo "le deben bastante" |
| `bg-form.webp` | 600×400 | Ilustración decorativa (esquina superior derecha) de la tarjeta "Nuevo gasto" |
| `bg-report.webp` | 600×400 | Ilustración decorativa (esquina inferior) del modal de informes |

Los fondos de nivel se muestran a pantalla completa (`background-size: cover`);
`bg-form.webp` y `bg-report.webp` se usan más chicos, como ilustración de
esquina con `background-blend-mode: luminosity`, así el texto siempre queda
legible sin importar cuán cargada esté la imagen.

## `sprites/`

| Archivo | Tamaño sugerido | Dónde se usa |
|---|---|---|
| `cerdito1.webp` | 1408×768, fondo transparente | Personaje izquierdo de la escena "tira y afloje" (Inicio) |
| `cerdito2.webp` | 1408×768, fondo transparente | Personaje derecho de la escena "tira y afloje" (Inicio) |

> Ojo: hoy estos sprites traen la soga dibujada dentro de la misma imagen.
> Para la escena nueva se recortan (configuración de recorte y ancla de la
> mano en `src/components/TugOfWar/configuracion.js`). Cuando llegue el arte
> final aislado (personaje solo, sin soga, con margen), se actualizan
> `PERSONAJE_IZQ` / `PERSONAJE_DER` y no hace falta tocar nada más.

## `tugofwar/`

| Archivo | Tamaño sugerido | Dónde se usa |
|---|---|---|
| `marcador.png` | ~cuadrado, fondo transparente | Marcador central (moño) que recorre la soga |

El recurso del marcador se reemplaza 1 a 1 desde
`src/components/TugOfWar/configuracion.js`. `soga.png` (textura) quedó en la
carpeta pero la soga hoy se dibuja 100% SVG con la paleta de la app
(`SOGA` en `configuracion.js`).

## Íconos funcionales

Los íconos de trash/calendar/pdf/excel **no son archivos de imagen**: son SVG
inline definidos directamente en `src/components/IconosRaster.jsx`. No hace
falta (ni corresponde) subir un `trash.png` ni similares — para cambiar su
diseño, se edita ese componente.

## Cómo se importan

Todo pasa por `src/assets/index.js`, que expone cuatro objetos:

```js
import { brandingAssets, backgroundAssets, spriteAssets, tugOfWarAssets } from "../assets";

brandingAssets.logo
backgroundAssets.nivel["le-deben-mucho"]  // o .form / .report
spriteAssets.cerdito1 / .cerdito2         // personajes de la escena "tira y afloje"
tugOfWarAssets.soga / .marcador           // textura de la soga y marcador
```
