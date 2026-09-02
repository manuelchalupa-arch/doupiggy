// src/assets/index.js
// Punto único de importación de imágenes.
// NOTA: los íconos funcionales (trash, calendar, pdf, excel) son
// SVG inline en components/IconosRaster.jsx.

// ---------- branding ----------
import logo from "./branding/logo.webp";
import splash from "./branding/splash.webp";
import titulo from "./branding/titulo.webp";
import madera from "./branding/madera.webp";
import soga from "./branding/soga.png";
import monoRojo from "./branding/mono-rojo.png";
import botonNuevoGrupo from "./branding/boton-nuevo-grupo.jpg";

// ---------- backgrounds (5 estados de saldo + 2 fondos de sección) ----------
import bgLevel1 from "./backgrounds/bg-level1.webp";
import bgLevel2 from "./backgrounds/bg-level2.webp";
import bgLevel3 from "./backgrounds/bg-level3.webp";
import bgLevel4 from "./backgrounds/bg-level4.webp";
import bgLevel5 from "./backgrounds/bg-level5.webp";
import bgForm from "./backgrounds/bg-form.webp";
import bgReport from "./backgrounds/bg-report.webp";

// ---------- sprites (escena "tira y afloje" de Inicio) ----------
// Cerdito 1: rico, arrogante, traje, sombrero de copa, monocle
// Cerdito 2: humilde, alegre, chaleco, gorra plana, tiradores
import cerdito1 from "./sprites/cerdito1.webp";
import cerdito2 from "./sprites/cerdito2.webp";

// ---------- avatares de perfil (recortes cuadrados + variantes de color) ----------
import avatarCerdito1 from "./sprites/avatar-cerdito1.webp";
import avatarCerdito2 from "./sprites/avatar-cerdito2.webp";
import avatarCerdito3 from "./sprites/avatar-cerdito3.webp";
import avatarCerdito4 from "./sprites/avatar-cerdito4.webp";
import avatarCerdito5 from "./sprites/avatar-cerdito5.webp";
import avatarCerdito6 from "./sprites/avatar-cerdito6.webp";

export const brandingAssets = { logo, splash, titulo, madera, soga, monoRojo, botonNuevoGrupo };

// Sprites completos de la escena "tira y afloje" (Inicio).
export const spriteAssets = {
  cerdito1, // Rico, arrogante — IZQUIERDA en la escena
  cerdito2, // Humilde, alegre — DERECHA en la escena
};

// Recursos de la escena "tira y afloje". La soga y el marcador (moño) viven
// en branding/ y se reutilizan acá; se reemplazan desde
// components/TugOfWar/configuracion.js.
export const tugOfWarAssets = { soga, marcador: monoRojo };

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

// Avatares seleccionables en Cuenta > Tu perfil: 6 en total — los 2
// personajes originales + 4 variantes de color de esos mismos dibujos
// (mismo trazo, distinta paleta). Para agregar más adelante arte 100%
// nuevo: importalo acá y sumalo a este array, nada más depende de esto.
export const avatarAssets = [
  { id: "cerdito1", src: avatarCerdito1, alt: "Avatar cerdito rico" },
  { id: "cerdito2", src: avatarCerdito2, alt: "Avatar cerdito humilde" },
  { id: "cerdito3", src: avatarCerdito3, alt: "Avatar cerdito rico (verde)" },
  { id: "cerdito4", src: avatarCerdito4, alt: "Avatar cerdito rico (azul)" },
  { id: "cerdito5", src: avatarCerdito5, alt: "Avatar cerdito humilde (violeta)" },
  { id: "cerdito6", src: avatarCerdito6, alt: "Avatar cerdito humilde (rojo)" },
];

