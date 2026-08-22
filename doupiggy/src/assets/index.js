// src/assets/index.js
// Punto único de importación de imágenes. Ningún componente importa un PNG
// directamente: todos pasan por acá. Así, si cambia un nombre de archivo,
// se corrige en un solo lugar.
//
// Colocá los archivos reales en las carpetas correspondientes con estos
// nombres exactos (ver ASSETS.md para specs de tamaño/formato).

// ---------- branding ----------
import logo from "./branding/logo.png";
import splash from "./branding/splash.png";
// favicon.ico no se importa acá: va referenciado directo en index.html
// (ver nota en ASSETS.md sobre cómo servirlo con Vite/CRA).

// ---------- backgrounds (5 estados de saldo + 2 fondos de sección) ----------
import bgLevel1 from "./backgrounds/bg-level1.png"; // debés bastante
import bgLevel2 from "./backgrounds/bg-level2.png"; // debés un poco
import bgLevel3 from "./backgrounds/bg-level3.png"; // están a mano
import bgLevel4 from "./backgrounds/bg-level4.png"; // te deben un poco
import bgLevel5 from "./backgrounds/bg-level5.png"; // te deben bastante
import bgForm from "./backgrounds/bg-form.png";
import bgReport from "./backgrounds/bg-report.png";

// ---------- sprites (animación de la cuerda en Inicio) ----------
import pigBoy from "./sprites/pig-boy.png";
import pigGirl from "./sprites/pig-girl.png";
import ropeArrow from "./sprites/rope-arrow.png";

// ---------- icons ----------
import iconTrash from "./icons/trash.png";
import iconCalendar from "./icons/calendar.png";
import iconPdf from "./icons/pdf.png";
import iconExcel from "./icons/excel.png";

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
  ropeArrow,
};

export const iconAssets = {
  trash: iconTrash,
  calendar: iconCalendar,
  pdf: iconPdf,
  excel: iconExcel,
};
