// components/TugOfWar/configuracion.js
// Punto único donde se define TODO lo reemplazable de la escena "tira y
// afloje": recursos gráficos, geometría (trayectoria de la soga, recortes de
// personajes, anclas de manos) y constantes de animación. Acá se cambia un
// valor o un archivo y nada más tiene que tocarse en la lógica.
//
// Coordenadas de la escena: el SVG usa un viewBox lógico de ESCENA.ancho x
// ESCENA.alto que escala proporcionalmente a cualquier ancho de pantalla;
// por eso TODAS las medidas de abajo están en esas unidades lógicas, no en px.

import { spriteAssets, tugOfWarAssets } from "../../assets";

// ---------------------------------------------------------------- recursos
// Reemplazá la imagen de un personaje o del marcador y actualizá su entrada
// acá; la animación y la geometría no cambian. La soga se dibuja 100% SVG
// (SOGA, abajo) con la paleta de la app.
export const RECURSOS = {
  personajeIzq: spriteAssets.cerdito1, // cerdito rico, IZQUIERDA
  personajeDer: spriteAssets.cerdito2, // cerdito humilde, DERECHA
  marcador: tugOfWarAssets.marcador,   // moño (recurso final del marcador)
};

export const ESCENA = {
  ancho: 1000,
  alto: 320,
};

// ---------------------------------------------------------------- personajes
// Cada personaje se recorta de su imagen original (recorte, en px de la imagen)
// y se escala a UN ANCHO VISUAL. El punto "mano" es el píxel de la imagen donde
// el personaje agarra la soga: se usa para alinear la mano exactamente con el
// extremo de la trayectoria (sin recortar ni deformar nada).
export const PERSONAJE_IZQ = {
  src: RECURSOS.personajeIzq,
  sprite: { w: 1408, h: 768 },
  recorte: { x: 190, y: 15, w: 930, h: 735 },
  mano: { x: 1119, y: 326 },
  ancho: 280,
};

export const PERSONAJE_DER = {
  src: RECURSOS.personajeDer,
  sprite: { w: 1408, h: 768 },
  recorte: { x: 460, y: 25, w: 700, h: 725 },
  mano: { x: 460, y: 377 },
  ancho: 230,
};

// ---------------------------------------------------------------- soga
// La soga se dibuja 100% SVG en capas finas, con la paleta de la app
// (verde/crema/cafés). Trayectoria y apariencia van separadas: la trayectoria
// (d) es lo que recorre el marcador; la apariencia son las capas de trazo.
export const SOGA = {
  // Trayectoria matemática. El marcador se mueve sobre ESTA path con
  // getPointAtLength() (0% = inicio, 100% = fin). Casi recta con una curva
  // muy sutil para que no parezca una línea geométrica perfecta.
  d: "M 300 168 C 390 174, 610 174, 700 168",
  // Extremos de la trayectoria: donde cada personaje agarra la soga.
  extremoIzq: { x: 300, y: 168 },
  extremoDer: { x: 700, y: 168 },
  // --- paleta (colores del usuario) ---
  colorSilueta: "#2A1F14",   // contorno exterior, casi negro cafés
  colorBorde: "#3D2B1F",     // borde interior
  colorCuerpo: "#5C4033",    // cuerpo de la soga
  colorSegmento: "#D4C4A0",  // segmentos alternos del trenzado
  colorNucleo: "#E8D5B0",    // fina línea central clara
  // --- grosores (unidades lógicas, finos) ---
  grosor: 11,
  grosorBorde: 9.5,
  grosorCuerpo: 8,
  grosorNucleo: 2.5,
  // Patrón del trenzado (dash a lo largo del recorrido).
  segmentoTrenzado: "7 7",
};

// ---------------------------------------------------------------- marcador
export const MARCADOR = {
  // Recurso final (PNG del moño). Mientras no exista, se usa el placeholder.
  recurso: RECURSOS.marcador || null,
  // El recurso se centra dentro de una caja de este tamaño en unidades
  // lógicas (preserveAspectRatio mantiene su proporción real).
  ancho: 60,
  alto: 60,
  // Punto del cuadro que debe quedar exactamente sobre el punto de la soga.
  anclajeX: 0.5,
  anclajeY: 0.5,
  // Placeholder (claramente separado del recurso final).
  placeholder: {
    radio: 14,
    relleno: "#e8b967",
    borde: "#8a5a2b",
  },
};

// ---------------------------------------------------------------- animación
// Duraciones y suavidades centralizadas acá. El movimiento principal usa un
// resorte suave (determinístico): se llega al objetivo sin saltos, con rebase
// mínimo al cambiar el saldo, y se detiene solo. El moño queda MUY quieto:
// sin vaivén sobre la trayectoria y con inclinación mínima.
export const ANIMACION = {
  resorte: { k: 40, c: 22 },                 // resorte amortiguado (poco rebase)
  vaivenMarcador: {
    amplitudFrac: 0,                         // sin vaivén sobre la trayectoria
    amplitudY: 0.5,                          // oscilación vertical mínima
    periodo: 3.6,
  },
  inclinacionMax: 8,                         // grados máximos de inclinación
  tironPersonajes: 0.05,                     // "tensión" al mover el marcador
  vaivenPersonajes: {
    amplitud: 1.0,
    periodo: 4.5,
    desfaseDer: Math.PI * 0.7,
  },
};