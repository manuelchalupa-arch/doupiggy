// src/assets/index.js
// Punto único de importación de imágenes.
// NOTA: los íconos funcionales (trash, calendar, pdf, excel) ahora son
// SVG inline en components/IconosRaster.jsx. No hace falta mantener PNGs.

// ---------- branding ----------
import logo from "./branding/logo.png";
import splash from "./branding/splash.png";
// favicon.ico no se importa acá: va referenciado directo en index.html

// ---------- backgrounds (5 estados de saldo + 2 fondos de sección) ----------
import bgLevel1 from "./backgrounds/bg-level1.png";
import bgLevel2 from "./backgrounds/bg-level2.png";
import bgLevel3 from "./backgrounds/bg-level3.png";
import bgLevel4 from "./backgrounds/bg-level4.png";
import bgLevel5 from "./backgrounds/bg-level5.png";
import bgForm from "./backgrounds/bg-form.png";
import bgReport from "./backgrounds/bg-report.png";

// ---------- sprites (animación de la cuerda en Inicio) ----------
import pigBoy from "./sprites/pig-boy.png";
import pigGirl from "./sprites/pig-girl.png";

export const brandingAssets = { logo, splash };

export const backgroundAssets = {
  nivel: {
    "muy-debe": bgLevel1,
    debe: bgLevel2,
    neutral: bgLevel3,
    "le-deben": bgLevel4,
    "le-deben-mucho": bgLevel5,
  },
  form: bgForm,
  report: bgReport,
};

export const spriteAssets = {
  pigBoy,
  pigGirl,
};
