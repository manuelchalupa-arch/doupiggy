# Guía paso a paso: publicar DouPiggy sin programar

Esta guía asume que **no vas a instalar nada en tu computadora ni usar la
terminal**. Todo se hace desde el navegador: GitHub para guardar los
archivos, Firebase para la base de datos, y Netlify para publicar la web.

Vas a necesitar 3 cuentas gratuitas (si no las tenés, se crean en 2 minutos
cada una):
- **GitHub** → github.com
- **Firebase** → usa tu cuenta de Google
- **Netlify** → netlify.com (te podés registrar con la misma cuenta de GitHub)

Calculá entre 45 minutos y 1 hora la primera vez. Cada paso es un click a la
vez, no hace falta entender el código.

---

## Parte 1 — Subir los archivos a GitHub

GitHub es donde va a "vivir" el código. Netlify después lo va a leer de ahí
para publicar la web automáticamente.

### 1.1 Crear la cuenta y el repositorio

1. Entrá a **github.com** y creá tu cuenta (si ya tenés, saltá este paso).
2. Arriba a la derecha, hacé click en el **+** y elegí **New repository**.
3. En "Repository name" escribí `doupiggy`.
4. Dejalo en **Public** (o Private, cualquiera de las dos funciona igual con Netlify).
5. **No marques** ninguna casilla de "Add a README" ni ".gitignore" — ya tenemos esos archivos.
6. Hacé click en **Create repository**.

### 1.2 Subir la carpeta completa

GitHub te muestra una página vacía con varias opciones. Buscá el link que
dice **"uploading an existing file"**.

1. Te va a aparecer una zona gris que dice "Drag files here to add them to your repository".
2. Descargá a tu computadora **toda** la carpeta `doupiggy` que te fui pasando en el chat (todos los archivos, respetando las carpetas `src/`, `firebase/`, `diseno/`, y los archivos sueltos como `package.json`, `index.html`, `README.md`, etc.).
3. Abrí esa carpeta en el explorador de archivos de tu computadora (Finder en Mac, Explorador en Windows).
4. **Arrastrá la carpeta `doupiggy` completa** (o todo su contenido seleccionado) sobre la zona gris de GitHub. Los navegadores modernos (Chrome, Edge) mantienen las subcarpetas tal cual están.
5. Esperá a que termine de cargar la barra de progreso de cada archivo.
6. Abajo de todo, en "Commit changes", dejá el mensaje que viene por defecto y hacé click en **Commit changes**.

> **Si arrastrar la carpeta entera no te funciona**: subí carpeta por
> carpeta. Entrá a cada subcarpeta (`src`, `src/components`, `src/services`,
> etc.) usando el botón **Add file > Upload files** y arrastrá ahí adentro
> solo los archivos de esa carpeta. Es más lento pero funciona igual.

### 1.3 Confirmar que quedó bien

Navegá por el repositorio en GitHub y fijate que exista esta estructura
(son las carpetas y archivos principales):

```
doupiggy/
├── index.html
├── package.json
├── src/
│   ├── App.jsx
│   ├── assets/
│   ├── components/
│   ├── services/
│   └── ...
├── firebase/
│   └── firestore.rules
└── README.md
```

Si falta algo, volvé al paso 1.2 y subí lo que falte (podés usar **Add
file > Upload files** las veces que necesites).

---

## Parte 2 — Cargar tus imágenes reales

Ahora mismo la app tiene imágenes de relleno (placeholders con los colores
de la marca) para que todo se vea completo. Vas a reemplazarlas por tus
imágenes finales, **una por una, sin cambiarles el nombre**.

1. En GitHub, andá a la carpeta correspondiente. Por ejemplo, para el logo: `src` → `assets` → `branding`.
2. Vas a ver `logo.png`, `splash.png`, `favicon.ico`.
3. Hacé click en **Add file > Upload files**.
4. Arrastrá tu imagen nueva, pero **con el mismo nombre exacto** que el archivo que querés reemplazar (por ejemplo, tu logo final tiene que llamarse `logo.png`, todo en minúscula).
5. GitHub te va a avisar "This file already exists, are you sure you want to replace it?" — confirmá que sí.
6. Repetí con **Commit changes**.

Hacé lo mismo para cada carpeta:

| Carpeta | Archivos a reemplazar |
|---|---|
| `src/assets/branding/` | `logo.png`, `splash.png`, `favicon.ico` |
| `src/assets/backgrounds/` | `bg-level1.png` a `bg-level5.png`, `bg-form.png`, `bg-report.png` |
| `src/assets/sprites/` | `pig-boy.png`, `pig-girl.png`, `rope-arrow.png` |
| `src/assets/icons/` | `trash.png`, `calendar.png`, `pdf.png`, `excel.png` |

> Los tamaños sugeridos y dónde se usa cada imagen están detallados en el
> archivo `ASSETS.md` que está en la raíz del repositorio — abrilo
> directamente en GitHub para consultarlo cuando lo necesites.

Podés hacer este paso ahora o después de que la web ya esté publicada — cada
vez que reemplaces una imagen y confirmes el cambio en GitHub, Netlify va a
volver a publicar la web sola con la imagen nueva (lo vas a ver en la Parte 5).

---

## Parte 3 — Crear el proyecto en Firebase

Firebase es el servicio que guarda los datos (usuarios, grupos, gastos) y
maneja el login. Es gratis para este tamaño de app.

### 3.1 Crear el proyecto

1. Entrá a **console.firebase.google.com** con tu cuenta de Google.
2. Hacé click en **Crear un proyecto** (o "Add project").
3. Ponele un nombre, por ejemplo `DouPiggy`.
4. Podés desactivar Google Analytics si no lo vas a usar (no hace falta para esta app). Click en **Crear proyecto**.

### 3.2 Activar el login (Authentication)

1. En el menú de la izquierda, andá a **Authentication**.
2. Click en **Comenzar** (Get started).
3. En la pestaña **Sign-in method**, hacé click en **Google**, activalo con el switch, elegí un email de soporte, y **Guardar**.
4. Volvé a la lista de métodos, hacé click en **Correo/Contraseña** (Email/Password), activalo con el switch y **Guardar**. Así la pantalla de inicio permite además registrarse o entrar con email + contraseña.
5. No hace falta activar **Anónimo**: los invitados que abren un enlace entran con su propia cuenta (Google o correo), el acceso anónimo ya no se usa.

### 3.3 Activar la base de datos (Firestore)

1. En el menú de la izquierda, andá a **Firestore Database**.
2. Click en **Crear base de datos** (Create database).
3. Elegí **modo producción** (production mode) — es el que exige las reglas de seguridad que ya tenemos escritas.
4. Elegí la ubicación del servidor más cercana (por ejemplo `southamerica-east1`) y confirmá.

### 3.4 Pegar las reglas de seguridad

Esto es importante: sin este paso, cualquier persona podría leer o escribir
los datos de otros grupos.

1. Dentro de **Firestore Database**, andá a la pestaña **Rules** (Reglas).
2. Vas a ver un editor de texto con unas reglas por defecto.
3. Borrá todo el contenido de ese editor.
4. Andá a GitHub, abrí el archivo `firebase/firestore.rules` de tu repositorio, copiá **todo** su contenido.
5. Pegalo en el editor de reglas de Firebase.
6. Click en **Publicar** (Publish).

### 3.5 Obtener las credenciales de la app web

1. En Firebase, andá al ícono de **engranaje** (arriba a la izquierda) → **Configuración del proyecto**.
2. Bajá hasta "Tus apps" y hacé click en el ícono **</>** (Web).
3. Ponele un apodo, por ejemplo `doupiggy-web`, y click en **Registrar app**.
4. Firebase te va a mostrar un bloque de código con algo así:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "doupiggy-xxxxx.firebaseapp.com",
  projectId: "doupiggy-xxxxx",
  storageBucket: "doupiggy-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

5. **Dejá esta pantalla abierta o copiá estos 6 valores a un bloc de notas** — los vas a necesitar en la Parte 4. No hace falta que entiendas qué significan, solo copiarlos tal cual.

---

## Parte 4 — Publicar la web con Netlify

### 4.1 Conectar Netlify con GitHub

1. Entrá a **netlify.com** y registrate (podés elegir "Sign up with GitHub" para que quede todo conectado de una).
2. En el panel principal, click en **Add new site > Import an existing project**.
3. Elegí **GitHub** y autorizá el acceso cuando te lo pida.
4. Buscá y seleccioná el repositorio **doupiggy**.

### 4.2 Configurar cómo se construye la web

Netlify te va a preguntar los comandos de build. Completá exactamente así:

- **Build command**: `npm run build`
- **Publish directory**: `dist`

### 4.3 Cargar las credenciales de Firebase

Antes de hacer click en "Deploy", buscá la sección **"Environment variables"**
(o "Add environment variables") en esa misma pantalla, y agregá una por una
las 6 variables, usando los valores que copiaste en el paso 3.5:

| Nombre de la variable | Valor (de tu Firebase) |
|---|---|
| `VITE_FIREBASE_API_KEY` | el valor de `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | el valor de `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | el valor de `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | el valor de `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | el valor de `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | el valor de `appId` |

> Si no ves esta sección en la pantalla de importación, no hay problema:
> podés cargarlas después en **Site configuration > Environment variables >
> Add a variable**, y después volver a publicar (Parte 4.5).

### 4.4 Publicar

Click en **Deploy doupiggy** (o "Deploy site"). Netlify va a tardar 1-3
minutos armando la web. Vas a ver un log de texto corriendo — cuando termine
y diga "Published", te va a dar una dirección tipo
`https://doupiggy-xxxxx.netlify.app`.

### 4.5 Habilitar esa dirección en Firebase (paso que mucha gente se salta)

Google no deja que cualquier sitio use el botón "Ingresar con Google" — hay
que autorizarlo explícitamente:

1. Copiá tu dirección de Netlify (sin el `https://`, por ejemplo `doupiggy-xxxxx.netlify.app`).
2. Volvé a Firebase Console → **Authentication** → pestaña **Settings** → **Authorized domains**.
3. Click en **Add domain**, pegá tu dirección de Netlify, y confirmá.

Sin este paso, el login con Google va a fallar con un error de dominio no
autorizado.

---

## Parte 5 — Probarla

1. Abrí la dirección `https://doupiggy-xxxxx.netlify.app` que te dio Netlify.
2. Deberías ver el splash animado de DouPiggy y después la pantalla de login.
3. Iniciá sesión con Google.
4. Como es la primera vez, te va a aparecer la pantalla "Creá tu primer grupo" — ponele un nombre y confirmá.
5. Ya deberías estar adentro de la app, con las 3 pestañas (Inicio, Gastos, Información) funcionando de verdad, guardando datos reales en tu Firebase.

---

## Cómo actualizar la web más adelante

Cada vez que quieras cambiar algo (por ejemplo, subir una imagen final
nueva), el flujo es siempre el mismo:

1. Subís el archivo nuevo a GitHub (Parte 2, con "Add file > Upload files", confirmando el reemplazo).
2. Netlify **detecta el cambio solo** y vuelve a publicar la web automáticamente en 1-2 minutos.
3. No hace falta tocar nada en Netlify ni en Firebase para esto.

---

## Problemas comunes

**La web carga pero queda en blanco / no pasa del splash.**
Casi siempre es que faltó alguna variable de entorno en Netlify, o tiene un
typo. Revisá **Site configuration > Environment variables** en Netlify y
comparalas con la tabla del paso 4.3. Después de corregir, andá a
**Deploys > Trigger deploy > Deploy site** para que tome los cambios.

**"Ingresar con Google" tira un error de dominio.**
Te faltó el paso 4.5 (autorizar el dominio de Netlify en Firebase).

**Guardo un gasto y no aparece, o tira un error de permisos.**
Revisá que hayas publicado las reglas de seguridad (paso 3.4) — si el
editor de reglas en Firebase quedó con el contenido por defecto en vez del
de `firestore.rules`, los permisos no van a coincidir con lo que espera la app.

**Subí una imagen nueva y no cambió nada.**
Fijate que el nombre del archivo sea idéntico al que reemplazaste (mismo
nombre, mismas mayúsculas/minúsculas, misma extensión `.png`). Si el nombre
no coincide exactamente, la app sigue usando la imagen vieja.

**No sé si Netlify terminó de publicar.**
En Netlify, pestaña **Deploys**, el último de la lista tiene que decir
"Published" en verde. Si dice "Failed", hacé click para ver el detalle del
error — casi siempre es alguna variable de entorno mal escrita.
