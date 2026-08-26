// src/assets/index.js
// Punto único de importación de imágenes.
// NOTA: los íconos funcionales (trash, calendar, pdf, excel) son
// SVG inline en components/IconosRaster.jsx.

// ---------- branding ----------
import logo from "./branding/logo.webp";
import splash from "./branding/splash.webp";

// ---------- backgrounds (5 estados de saldo + 2 fondos de sección) ----------
import bgLevel1 from "./backgrounds/bg-level1.webp";
import bgLevel2 from "./backgrounds/bg-level2.webp";
import bgLevel3 from "./backgrounds/bg-level3.webp";
import bgLevel4 from "./backgrounds/bg-level4.webp";
import bgLevel5 from "./backgrounds/bg-level5.webp";
import bgForm from "./backgrounds/bg-form.webp";
import bgReport from "./backgrounds/bg-report.webp";

// ---------- sprites (animación de la cuerda en Inicio) ----------
// Cerdito 1: rico, arrogante, traje, sombrero de copa, monocle
// Cerdito 2: humilde, alegre, chaleco, gorra plana, tiradores
//
// TEMPORAL: cerdito1.png / cerdito2.png (el arte definitivo) todavía no
// están subidos. Mientras tanto reusamos los sprites viejos (pig-boy.png /
// pig-girl.png, que sí existen en el repo) para que la app compile y se
// vea completa. Apenas subas los 2 archivos definitivos a esta carpeta,
// solo hay que cambiar estas 2 líneas de import — nada más en el código
// depende del nombre de archivo.
import cerdito1 from "./sprites/pig-boy.png";
import cerdito2 from "./sprites/pig-girl.png";

export const brandingAssets = { logo, splash };

export const backgroundAssets = {
  nivel: {
    "muy-debe": bgLevel1,      // Debo mucho — tornado, desolación
    debe: bgLevel2,             // Debo poco — tormenta lejana, preocupación
    neutral: bgLevel3,          // Equilibrio — prado normal, cabaña, arroyo
    "le-deben": bgLevel4,       // Me deben — sol sonriente, felicidad
    "le-deben-mucho": bgLevel5, // Me deben mucho — paraíso, arcoíris, abundancia
  },
  form: bgForm,
  report: bgReport,
};

export const spriteAssets = {
  cerdito1, // Derecha, rico, arrogante, tira hacia la derecha
  cerdito2, // Izquierda, humilde, alegre, tira hacia la izquierda
};

