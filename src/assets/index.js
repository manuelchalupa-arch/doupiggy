// src/assets/index.js
// Punto único de importación de imágenes.
// NOTA: los íconos funcionales (trash, calendar, pdf, excel) son
// SVG inline en components/IconosRaster.jsx.

// ---------- branding ----------
import logo from "./branding/logo.png";
import splash from "./branding/splash.png";

// ---------- backgrounds (5 estados de saldo + 2 fondos de sección) ----------
import bgLevel1 from "./backgrounds/bg-level1.png";
import bgLevel2 from "./backgrounds/bg-level2.png";
import bgLevel3 from "./backgrounds/bg-level3.png";
import bgLevel4 from "./backgrounds/bg-level4.png";
import bgLevel5 from "./backgrounds/bg-level5.png";
import bgForm from "./backgrounds/bg-form.png";
import bgReport from "./backgrounds/bg-report.png";

// ---------- sprites (animación de la cuerda en Inicio) ----------
// Cerdito 1: rico, arrogante, traje, sombrero de copa, monocle
// Cerdito 2: humilde, alegre, chaleco, gorra plana, tiradores
import cerdito1 from "./sprites/cerdito1.png";
import cerdito2 from "./sprites/cerdito2.png";

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
