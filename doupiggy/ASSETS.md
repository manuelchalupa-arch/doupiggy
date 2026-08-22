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
| `logo.png` | 512×512, fondo transparente | PNG | Splash (aro central) e ícono de marca en Información |
| `splash.png` | 750×1334 (proporción de pantalla de celular) | PNG | Fondo de pantalla completa del splash |
| `favicon.ico` | 16/32/48/64 multi-tamaño | ICO | Pestaña del navegador (`index.html`) |

## `backgrounds/`

| Archivo | Tamaño sugerido | Dónde se usa |
|---|---|---|
| `bg-level1.png` | 750×1334 | Fondo de Inicio — saldo "debe bastante" |
| `bg-level2.png` | 750×1334 | Fondo de Inicio — saldo "debe un poco" |
| `bg-level3.png` | 750×1334 | Fondo de Inicio — saldo "a mano" |
| `bg-level4.png` | 750×1334 | Fondo de Inicio — saldo "le deben un poco" |
| `bg-level5.png` | 750×1334 | Fondo de Inicio — saldo "le deben bastante" |
| `bg-form.png` | 600×400 | Ilustración decorativa (esquina superior derecha) de la tarjeta "Nuevo gasto" |
| `bg-report.png` | 600×400 | Ilustración decorativa (esquina inferior) del modal de informes |

Los fondos de nivel se muestran a pantalla completa (`background-size: cover`);
`bg-form.png` y `bg-report.png` se usan más chicos, como ilustración de
esquina con `background-blend-mode: luminosity`, así el texto siempre queda
legible sin importar cuán cargada esté la imagen.

## `sprites/`

| Archivo | Tamaño sugerido | Dónde se usa |
|---|---|---|
| `pig-boy.png` | 220×280, fondo transparente | Cuerda animada de Inicio, lado izquierdo |
| `pig-girl.png` | 220×280, fondo transparente | Cuerda animada de Inicio, lado derecho |
| `rope-arrow.png` | 320×80, fondo transparente | Cuerda + flecha central; se rota y desplaza por JS según el saldo |

`pig-boy` y `pig-girl` deben quedar recortados a la silueta (sin fondo) para
que el CSS los pueda animar como capas independientes sobre el fondo del nivel.

## `icons/`

| Archivo | Tamaño sugerido | Dónde se usa |
|---|---|---|
| `trash.png` | 64×64, fondo transparente | Botón de borrar gasto y borrar préstamo |
| `calendar.png` | 64×64, fondo transparente | Botón "Generar informe" |
| `pdf.png` | 64×64, fondo transparente | Botón de exportar informe en PDF |
| `excel.png` | 64×64, fondo transparente | Botón de exportar informe en Excel/CSV |

Los íconos se renderizan a 14–16px dentro de botones, así que conviene que
el trazo sea simple y grueso (van a perder detalle fino a ese tamaño).

## Cómo se importan

Todo pasa por `src/assets/index.js`, que expone cuatro objetos:

```js
import { brandingAssets, backgroundAssets, spriteAssets, iconAssets } from "../assets";

brandingAssets.logo
backgroundAssets.nivel["le-deben-mucho"]  // o .form / .report
spriteAssets.pigBoy / .pigGirl / .ropeArrow
iconAssets.trash / .calendar / .pdf / .excel
```
