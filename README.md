# DouPiggy

App de gastos compartidos en pesos argentinos, React + Firebase, offline-first,
con identidad visual de dibujos animados de los años 30 (estilo rubber-hose)
y mascota propia. Sign-in con Google o correo+contraseña para quien crea el
grupo y para invitados (ya no hay acceso anónimo: quienes entran por un enlace
de invitación se identifican con su propia cuenta), cálculo de saldos y
liquidación de deudas, alta de gastos con división igualitaria, e informes
exportables.

## Cómo correrlo

```bash
npm install
npm run dev
```

Necesitás las variables de entorno de Firebase con el prefijo `VITE_FIREBASE_*`
(`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
`VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`,
`VITE_FIREBASE_APP_ID`) para que la autenticación y Firestore funcionen. En
Netlify se configuran en Site settings → Environment variables.

## Estructura

```
index.html                  HTML raíz (favicon real de DouPiggy)
vite.config.js
package.json

src/
  main.jsx                  Punto de montaje de React
  App.jsx                   Orquestación: splash -> auth -> grupo -> AppShell

  assets/
    index.js                 Único punto de importación de imágenes
    branding/                 logo.webp, splash.webp, titulo.webp, madera.webp,
                              soga.png (barra de carga) + mono-rojo.png (moño)
    backgrounds/               bg-level1..5.webp, bg-form.webp, bg-report.webp
    sprites/                    avatar-cerdito1..6.webp (avatares de perfil)

  firebase/
    firebaseConfig.js         Inicialización Firestore (offline-first) + Auth

  services/                   Lógica de negocio pura, sin JSX
    authService.js             Google + correo/contraseña + invitaciones
    invitationService.js       Enlaces temporales de invitación
    groupService.js            CRUD de grupos y membresía
    expenseService.js          Alta de gastos + división igualitaria (centavos enteros)
    profileService.js          Perfil: nombre, correo, CBU/alias (uno de los dos)
    reportService.js           Informes: filtro por rango + exportación Excel/PDF
    pagoService.js             Liquidación: marcar/desmarcar pagos recibidos + cerrar

  hooks/                      Adaptadores de los servicios al ciclo de vida de React
    useAuthState.js
    useExpenses.js
    usePagos.js

  context/
    ThemeContext.jsx           Modo día/noche: dos paletas de color reales
                                (no un filtro de brillo), persistido en localStorage

  styles/                     Design system modular, importado desde theme.css
    theme.css                  Punto de entrada: importa los 7 módulos de abajo
    tokens.css                  Colores (paleta día/noche), tipografía, espaciado, sombras
    reset.css                   box-sizing consistente
    base.css                    body, headings, .app-root (fondo + textura)
    layout.css                  Tarjetas, contenedores, grids, responsive
    components.css              Botones, inputs, badges, calendario, historial, etc.
    animations.css               Vocabulario de animación cartoon (respeta prefers-reduced-motion)
    accessibility.css            Foco visible por teclado, utilidades screen-reader

  components/
    SplashScreen.jsx            Pantalla de carga con logo + splash de fondo
    AppShell.jsx                 Header "cartel" + navegación por pestañas
    AppHeader.jsx                  Header persistente (marca + contexto de pantalla)
    HomeSummary.jsx                Inicio: saldo neto + 5 fondos por zona
    Chanchito.jsx                   Sistema reutilizable de personajes (estados de animación)
    ExpenseForm.jsx                  Gastos: alta ("hoja contable") + historial + informes
    SettlementPanel.jsx               Resumen: quién le debe a quién (con pagos recibidos descontados)
    LiquidationPanel.jsx              Liquidación: tildar pagos recibidos y cerrarla
    InfoProfile.jsx                    Cuenta: perfil, grupos, informes, configuración
    CalendarioRango.jsx                 Selector de rango de fechas para informes
    IconoTab.jsx / IconoAstro.jsx        Íconos SVG de navegación y sol/luna
    IconosRaster.jsx                      Íconos SVG inline (trash, calendar, pdf, excel)
    CrearGrupoScreen.jsx                   Alta del primer grupo
    InvitarGrupo.jsx / InvitarTrasCrear.jsx Flujo de invitación por enlace

  utils/
    format.js                   formatoARS (formato de moneda) — no redeclarar en otro lado
    division.js                 parteDeGasto: la parte exacta (centavos) de cada participante
                                de un gasto, única fuente de verdad para todos los saldos
    nivelSaldo.js               Saldo neto del usuario + zona visual (5 niveles)
    calcularDeudas.js           Resumen: quién le debe a quién + resumen por miembro

firebase/
  firestore.rules              Reglas de seguridad: aislamiento por grupo/usuario.
                                Este archivo es SOLO documentación/backup — las reglas
                                reales se publican a mano en Firebase Console → Firestore
                                Database → Rules. Mantenerlos sincronizados es manual.
  ESTRUCTURA_DB.md              Diseño de colecciones

ASSETS.md                      Especificación de cada imagen (tamaño, formato, dónde se usa)
GUIA-PASO-A-PASO.md            Cómo publicar todo sin usar la terminal (GitHub + Firebase + Netlify)
```

## Identidad visual

- **Paleta**: día y noche son dos paletas de color reales definidas como variables
  CSS en `src/styles/tokens.css` (no un filtro de brillo). Marfil/papel, tinta,
  mostaza, rojo ladrillo, verde apagado, azul petróleo y un rosa "piggy" de marca.
- **Tipografía**: Fredericka the Great (títulos) + Arvo (cuerpo) + Courier Prime (montos).
- **Personajes**: `Chanchito.jsx` es la mascota de los dos chanchitos (cerdito
  rico y cerdito humilde, recortes cuadrados de `avatarAssets` en
  `assets/index.js`) con frases según cada una de las 5 zonas de saldo.
- **Inicio**: `HomeSummary.jsx` calcula el saldo neto real con
  `nivelSaldo.calcularSaldoUsuario` (que usa la división exacta guardada en
  cada gasto, o montos/partes como respaldo) y lo traduce a una de las 5
  zonas (`backgroundAssets.nivel`). La pestaña
  Resumen usa el mismo criterio (`calcularDeudas` / `utils/division.js`), con
  los pagos confirmados como recibidos ya descontados (pagoService).
- **Modo oscuro**: `ThemeContext.jsx` aplica la clase `.tema-noche` al contenedor
  raíz (`.app-root`), que redefine las variables de color en `tokens.css`.

## Nota sobre los avatares de los chanchitos

Los personajes (cerdito rico y cerdito humilde) viven como avatares
cuadrados en `src/assets/sprites/avatar-cerdito1..6.webp` y `assets/index.js`
los expone en `avatarAssets` (6 variantes, usados en `Chanchito.jsx`, en la
creación de grupos y en Cuenta > Tu perfil).

## Sobre los assets

Backgrounds y branding están en `.webp` (más liviano). Los sprites siguen en
`.png` por ahora. El mapeo completo, tamaños sugeridos y dónde se usa cada
archivo está en `ASSETS.md`.
