// components/Chanchito.jsx
// Mascota reactiva que comenta el estado financiero del grupo.
// Ahora con dos cerditos varones: Cerdito 1 (rico) y Cerdito 2 (humilde).

import { avatarAssets } from "../assets";

const FRASES = {
  "muy-debe": [
    "¡Estamos en la lona! Hay que hablar seriamente.",
    "La cabaña se está quemando, amigo...",
    "Esto es un desastre. ¿Quién pagó esto?",
    "¡Alerta roja! Necesitamos un plan de rescate.",
  ],
  debe: [
    "Hay nubes en el horizonte, pero no todo está perdido.",
    "Cuidado, se viene tormenta si seguimos así.",
    "Un poco de ajuste y volvemos al equilibrio.",
    "No está mal, pero podría estar mejor.",
  ],
  neutral: [
    "¡Perfecto! Ni debe ni le deben. Paz total.",
    "Todo en orden. Sigan así.",
    "Equilibrio financiero. Qué lindo es estar a mano.",
    "Nada que reclamar, nada que pagar. ¡Ideal!",
  ],
  "le-deben": [
    "¡Bien! Estamos en números azules.",
    "El sol brilla y las cuentas cuadran.",
    "¡Felicitaciones! Te deben plata.",
    "Todo va viento en popa.",
  ],
  "le-deben-mucho": [
    "¡Sos el rey del prado! Te deben un montón.",
    "¡Paraíso financiero! Disfrutá el arcoíris.",
    "¡Increíble! Estás nadando en monedas de oro.",
    "¡El cerdito rico estaría orgulloso!",
  ],
};

function fraseAleatoria(nivel) {
  const lista = FRASES[nivel] || FRASES.neutral;
  return lista[Math.floor(Math.random() * lista.length)];
}

/**
 * @param {object} props
 * @param {string} props.nivel — "muy-debe" | "debe" | "neutral" | "le-deben" | "le-deben-mucho"
 */
export default function Chanchito({ nivel }) {
  const cara =
    nivel === "muy-debe"
      ? "sad"
      : nivel === "debe"
      ? "worried"
      : nivel === "neutral"
      ? "normal"
      : nivel === "le-deben"
      ? "happy"
      : "excited";

  // Cerdito 1 (rico, arrogante) para estados positivos
  // Cerdito 2 (humilde, alegre) para estados negativos o neutrales
  // Se usa el recorte cuadrado (avatarAssets) en vez del sprite completo:
  // a 48px el sprite entero (con el lienzo grande de la soga) se ve
  // como un puntito; el recorte muestra el personaje entero y legible.
  const sprite =
    nivel === "le-deben-mucho" || nivel === "le-deben"
      ? avatarAssets[0].src
      : avatarAssets[1].src;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginTop: 12,
        padding: "8px 10px",
        border: "2px dashed var(--ink)",
        borderRadius: 12,
        background: "var(--cream)",
      }}
    >
      <img
        src={sprite}
        alt={`Cerdito ${cara}`}
        style={{
          width: 48,
          height: 48,
          objectFit: "contain",
          flex: "none",
        }}
      />
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1.35,
        }}
      >
        {fraseAleatoria(nivel)}
      </p>
    </div>
  );
}
