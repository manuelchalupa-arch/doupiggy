# Iconos de DouPiggy

Carpeta central de todos los íconos de la aplicación, pensada para que
gestionar los recursos gráficos sea tan simple como **agregar un archivo y
registrarlo** en `src/assets/iconos/index.js`.

## Estructura

```
src/assets/iconos/
├── README.md            ← esta guía
├── navegacion/          ← pestañas y selector de grupo (solo SVG)
├── acciones/            ← botones de acción (SVG monocromo, o WebP si el arte es detallado/color)
└── estados/             ← estados visuales (pago pendiente/recibido)
```

## Formato y peso

- **SVG para íconos de interfaz** (botones, pestañas, tildes, chevrons):
  prioridad absoluta, son vectores livianos y escalan a cualquier tamaño.
- **WebP para imágenes detalladas o decorativas** (logo, escenarios, avatares,
  sprites). Nunca PNG: ocupan más por el mismo resultado visual.
- Todos los íconos deben ser **cuadrados** (viewBox `0 0 24 24` o `0 0 40 40`),
  con el dibujo centrado y un margen de seguridad de ~5% por lado.

## Reglas por tipo de ícono

### SVG monocromo (lo más común: botones y pestañas)
- El dibujo va en **negro puro `#000`** (fill o stroke).
- La app los tiñe con el color del momento (modo día/noche) usando
  `mask` + `background-color: currentColor`. Así un solo archivo sirve
  para toda la app, en ambos temas.
- Sin rellenos de color propios y sin gradientes en estos casos.

### SVG/WebP a color (marcas o arte que no debe teñirse)
- Ej.: logo de WhatsApp, logo de Google, avatares cerdito, sprites.
- Se usan tal cual con `<img>` y no se tiñen.

## Convención de nombres

`kebab-case`, en minúsculas, describiendo la acción o concepto:

| Archivo            | Uso                              |
| ------------------ | -------------------------------- |
| `inicio.svg`       | Pestaña Inicio                   |
| `gastos.svg`       | Pestaña Gastos                   |
| `resumen.svg`      | Pestaña Resumen                  |
| `liquidacion.svg`  | Pestaña Liquidación              |
| `info.svg`         | Pestaña Info                     |
| `invitar.svg`      | Botón Invitar                    |
| `agregar-local.svg`| Botón Agregar miembro local      |
| `crear-grupo.svg`  | Botón Crear grupo                |
| `borrar.svg`       | Botones de borrar/eliminar       |
| `guardar.svg`      | Botón Guardar                    |
| `copiar.svg`       | Copiar enlace                    |
| `whatsapp.svg`     | Compartir por WhatsApp           |
| `google.svg`       | Ingresar con Google              |
| `instalar.svg`     | Instalar la app (PWA)            |
| `pdf.svg` / `excel.svg` | Formato de informe          |
| `estado.svg`       | Generar "Estado actual" (PDF)    |
| `informe.svg`       | Generar informe por fechas       |
| `cerrar.svg`        | Cerrar liquidación               |
| `recibido.svg` / `pendiente.svg` | Tilde de pago / casilla vacía |
| `reintentar.svg`    | Reintentar conexión              |
| `grupos.svg`        | Flecha del selector de grupo     |

## Texto visible por botón (decisiones ya tomadas)

| Botón | Ícono | Texto |
| ----- | ----- | ----- |
| Pestañas (5) | sí | **no** (solo `aria-label`) |
| Invitar / Invitar a este grupo | sí | **sí**, conserva la palabra |
| Guardar | sí | **sí**, conserva la palabra |
| PDF / Excel | sí | **no** (solo `aria-label`) |
| WhatsApp / Copiar enlace / Reintentar | sí | no |
| Agregar miembro local / Crear grupo / Borrar / Cerdito ▸ | sí | no |
| Ingresar con Google | sí (logo) | sí |
| Estado actual / Generar informe / Cerrar liquidación | sí | sí |
| Ingresar / Crear cuenta / Ahora no / Ahora no, continuar | no | sí |

## Cómo agregar un ícono nuevo

1. Copiar el archivo a la carpeta que corresponda (`navegacion`, `acciones`
   o `estados`).
2. Registrar el import en `src/assets/iconos/index.js` dentro del objeto
   `iconosApp` (una línea por ícono).
3. Usarlo desde cualquier componente:

```jsx
import { ComponenteIcono } from "../components/ComponenteIcono"; // se crea al integrar

<ComponenteIcono nombre="invitar" tamano={16} aquienTintar="texto" />
```

`ComponenteIcono` decide solo: SVG monocromo → se tiñe con `currentColor`;
archivo a color → se muestra tal cual. Todo botón que quede solo con imagen
**conserva un `aria-label`** para lector de pantalla (accesibilidad).

## Accesibilidad

Cada botón que quede sin texto visible igual describe su acción con
`aria-label` (ej. "Borrar gasto", "Invitar a este grupo", "Pasar a modo
noche"). El texto invisible es obligatorio, el texto visible se elimina.