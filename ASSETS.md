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
| `cerdito1.png` | 220×280, fondo transparente | Cerdito rico y arrogante — cuerda animada de Inicio, lado derecho |
| `cerdito2.png` | 220×280, fondo transparente | Cerdito humilde y alegre — cuerda animada de Inicio, lado izquierdo |

Los sprites deben quedar recortados a la silueta (sin fondo) para que el CSS
los pueda animar como capas independientes sobre el fondo del nivel.

## Íconos funcionales

Los íconos de trash/calendar/pdf/excel **no son archivos de imagen**: son SVG
inline definidos directamente en `src/components/IconosRaster.jsx`. No hace
falta (ni corresponde) subir un `trash.png` ni similares — para cambiar su
diseño, se edita ese componente.

## Cómo se importan

Todo pasa por `src/assets/index.js`, que expone cuatro objetos:

```js
import { brandingAssets, backgroundAssets, spriteAssets, iconAssets } from "../assets";

brandingAssets.logo
backgroundAssets.nivel["le-deben-mucho"]  // o .form / .report
spriteAssets.pigBoy / .pigGirl / .ropeArrow
iconAssets.trash / .calendar / .pdf / .excel
```
