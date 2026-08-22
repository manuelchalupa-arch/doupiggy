# DuoPiggy — proyecto completo (lógica + diseño visual + assets)

App de gastos compartidos en pesos argentinos, React + Firebase, offline-first,
con identidad visual de dibujos animados de los años 70 y mascota propia (el
chanchito de DouPiggy). Bloques 0 a 5 resueltos, capa de diseño aplicada a
toda la interfaz, y assets de imagen reales conectados en cada pantalla.

## Cómo correrlo

```bash
npm install
npm run dev
```

Necesitás las variables de entorno de Firebase (`VITE_FIREBASE_*` — ajustá
`src/firebase/firebaseConfig.js` si preferís otro prefijo de env vars según
tu configuración de Vite) para que la autenticación y Firestore funcionen.

## Estructura

```
index.html                  HTML raíz (favicon real de DouPiggy)
vite.config.js
package.json

src/
  main.jsx                  Punto de montaje de React
  App.jsx                   Orquestación: splash -> auth -> AppShell

  assets/
    index.js                 Único punto de importación de imágenes
    branding/                 logo.png, splash.png, favicon.ico
    backgrounds/               bg-level1..5.png, bg-form.png, bg-report.png
    sprites/                    pig-boy.png, pig-girl.png, rope-arrow.png
    icons/                       trash.png, calendar.png, pdf.png, excel.png

  firebase/
    firebaseConfig.js         Inicialización Firestore (offline-first) + Auth

  services/                   Lógica de negocio pura, sin JSX
    authService.js             Bloque 2: Google + anónimo vía invitación
    invitationService.js       Enlaces temporales de invitación
    groupService.js            CRUD de grupos y membresía
    expenseService.js          Bloque 3: alta de gastos + división igualitaria
    settlementService.js       Bloque 4: saldos netos + simplificación de deudas
    loanService.js             Bloque 5: préstamos directos + cuotas
    profileService.js          Perfil: nombre, correo, CBU/alias obligatorios
    reportService.js           Informes: filtro por rango + exportación Excel/PDF

  hooks/                      Adaptadores de los servicios al ciclo de vida de React
    useAuthState.js
    useExpenses.js
    useLoans.js

  context/
    ThemeContext.jsx           Modo claro/oscuro (el oscuro SOLO ajusta brillo)

  styles/
    theme.css                  Tokens visuales + clases reutilizables

  components/
    SplashScreen.jsx            Pantalla de carga con logo.png + splash.png
    AppShell.jsx                Header dinámico + navegación por pestañas
    HomeSummary.jsx              Inicio: cuerda animada (sprites reales) + 5 fondos
    ExpenseForm.jsx               Gastos: alta compacta + historial (4, scroll, borrado)
    SettlementPanel.jsx           Saldos y transacciones sugeridas
    LoanManager.jsx                Préstamos, cuotas y borrado
    InfoProfile.jsx                 Info: perfil, CBU/alias, informes, modo oscuro
    CalendarioRango.jsx             Selector de rango de fechas para informes

  utils/
    offlineSync.js              Helpers de conectividad para el modo offline-first

firebase/
  firestore.rules              Reglas de seguridad: aislamiento por grupo/usuario
  ESTRUCTURA_DB.md              Diseño de colecciones (Bloque 1)

diseno/
  prototipo-visual.html        Prototipo HTML autocontenido usado para validar
                                el look & feel antes de integrarlo a React

ASSETS.md                      Especificación de cada imagen (tamaño, formato,
                                dónde se usa) para reemplazar los placeholders
```

## Identidad visual

- **Marca**: DouPiggy, con un chanchito-alcancía retro como mascota
  (`src/assets/branding/logo.png`), presente en el splash y en el header
  de la pestaña Información.
- **Paleta**: crema/papel de fondo, mostaza, naranja quemado, verde palta,
  turquesa y magenta, más un rosa "piggy" de marca reservado para el avatar
  de perfil, con tinta marrón oscuro para los contornos gruesos tipo sticker
  (`src/styles/theme.css`, sección de variables `:root`).
- **Tipografía**: Bungee (títulos) + Baloo 2 (cuerpo).
- **Splash**: `SplashScreen.jsx` — `splash.png` de fondo y `logo.png` en el
  aro central con un "pop" elástico. Se muestra 2,2 segundos y pasa el
  control a `App.jsx`.
- **Inicio**: `HomeSummary.jsx` calcula el saldo neto real del usuario
  actual con `settlementService.calcularSaldosNetos` y lo traduce a una de
  5 zonas (`bg-level1.png` a `bg-level5.png` como fondo de pantalla), animando
  `pig-boy.png` / `pig-girl.png` en la cuerda y desplazando `rope-arrow.png`
  hacia el lado que "gana" el tironeo. Los umbrales (`UMBRAL_NEUTRO`,
  `UMBRAL_ALTO`) están al tope del archivo para ajustarlos fácilmente.
- **Gastos**: `ExpenseForm.jsx` combina el alta compacta con un historial de
  los últimos 4 gastos, scroll propio, `bg-form.png` como ilustración
  decorativa de esquina y `trash.png` como botón de borrado (llama a
  `expenseService.eliminarGasto`).
- **Préstamos**: `LoanManager.jsx` ahora también usa `trash.png` para borrar
  un préstamo completo (`loanService.eliminarPrestamo`, antes sin conectar a la UI).
- **Información**: `InfoProfile.jsx` valida CBU (22 dígitos) y alias como
  obligatorios, genera informes con `CalendarioRango.jsx` en dos formatos —
  Excel/CSV (`reportService.generarInformeExcel`) o PDF vía el diálogo de
  impresión del navegador (`reportService.generarInformePdf`) — cada uno con
  su ícono (`excel.png` / `pdf.png`), y expone el switch de modo oscuro.
- **Modo oscuro**: `ThemeContext.jsx` aplica la clase `.modo-oscuro` al
  contenedor raíz, que en `theme.css` solo hace
  `filter: brightness(0.55) contrast(1.05)` — nunca cambia variables de color.
  Se persiste en `localStorage`.

## Sobre los assets

Todas las imágenes se generaron como **placeholders con la paleta de marca**
(no son arte final) para que el proyecto compile y se vea completo desde el
primer `npm run dev`. Reemplazá cada archivo por tu diseño final respetando
el nombre exacto — el mapeo completo, tamaños sugeridos y dónde se usa cada
uno está en `ASSETS.md`.

## Próximos pasos sugeridos (fuera de este alcance)

- Cloud Function `onCall` para agregar miembros vía invitación con
  privilegios elevados.
- Pantalla de selección/creación de grupo (hoy se toma el primero de la lista).
- Tests unitarios de `settlementService.js`, `expenseService.js` y
  `profileService.js` (funciones puras, fáciles de testear sin mockear Firebase).
- Reemplazar los placeholders de `src/assets/` por el arte final.
