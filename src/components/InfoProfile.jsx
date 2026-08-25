// components/InfoProfile.jsx
// Perfil del usuario (nombre, correo, CBU/alias mutuamente opcionales) y
// gestión de grupos. El apartado de invitar vive en Gastos (aplicado
// siempre al grupo activo).
//
// Etapa 10 (rediseño): la pantalla ahora está dividida en 4 secciones
// claras (Mi cuenta / Mis grupos / Informes / Configuración) con un
// rótulo tipo cartel arriba de cada una, en vez de sentirse un "cajón de
// sastre". El cambio de modo día/noche volvió a vivir DENTRO del flujo
// de Configuración (ya no es una burbuja fija arriba a la derecha):
// flotando ahí chocaba con el nuevo header "cartel" de la etapa 2. La
// sección Informes no duplica el generador (que vive en Gastos, con su
// propia lógica): sólo explica dónde está y ofrece un atajo directo.

import { useState } from "react";
import { actualizarPerfil, esCbuValido, esAliasValido } from "../services/profileService";
import { crearGrupo } from "../services/groupService";
import { useTheme } from "../context/ThemeContext";
import { brandingAssets } from "../assets";
import InvitarGrupo from "./InvitarGrupo";
import { IconoSol, IconoLuna } from "./IconoAstro";

/**
 * @param {object} props
 * @param {string} props.uidActual
 * @param {object} props.perfil
 * @param {string} props.grupoId
 * @param {Array} [props.grupos]
 * @param {(id: string) => void} [props.onCambiarGrupo]
 * @param {() => void} [props.onIrAGastos] - atajo para la sección Informes
 */
export default function InfoProfile({ uidActual, perfil, grupoId, grupos = [], onCambiarGrupo, onIrAGastos }) {
  const { modoOscuro, alternarModo } = useTheme();

  const [nombre, setNombre] = useState(perfil?.nombre ?? "");
  const [correo, setCorreo] = useState(perfil?.correoContacto ?? perfil?.email ?? "");
  const [cbu, setCbu] = useState(perfil?.datosCobro?.cbu ?? "");
  const [alias, setAlias] = useState(perfil?.datosCobro?.alias ?? "");
  const [tocado, setTocado] = useState({ cbu: false, alias: false });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const [modalGrupoAbierto, setModalGrupoAbierto] = useState(false);
  const [nombreNuevoGrupo, setNombreNuevoGrupo] = useState("");
  const [creandoGrupo, setCreandoGrupo] = useState(false);
  const [errorGrupo, setErrorGrupo] = useState(null);
  const [grupoRecienCreadoId, setGrupoRecienCreadoId] = useState(null);

  const cbuInvalido = tocado.cbu && cbu.trim() !== "" && !esCbuValido(cbu);
  const aliasInvalido = tocado.alias && alias.trim() !== "" && !esAliasValido(alias);
  const faltanAmbos = tocado.cbu && tocado.alias && cbu.trim() === "" && alias.trim() === "";

  const iniciales = (nombre || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function guardarPerfil(evento) {
    evento.preventDefault();
    setTocado({ cbu: true, alias: true });
    setMensaje(null);
    setGuardando(true);
    try {
      await actualizarPerfil(uidActual, { nombre, correoContacto: correo, cbu, alias });
      setMensaje({ tipo: "ok", texto: "Perfil guardado" });
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  async function crearOtroGrupo(evento) {
    evento.preventDefault();
    if (!nombreNuevoGrupo.trim()) return;
    setErrorGrupo(null);
    setCreandoGrupo(true);
    try {
      const grupoIdNuevo = await crearGrupo({
        nombre: nombreNuevoGrupo.trim(),
        creadoPor: uidActual,
        nombreCreador: perfil?.nombre ?? nombre ?? "Vos",
        fotoCreador: perfil?.foto ?? null,
      });
      setGrupoRecienCreadoId(grupoIdNuevo);
      setNombreNuevoGrupo("");
    } catch (err) {
      setErrorGrupo(err.message);
    } finally {
      setCreandoGrupo(false);
    }
  }

  return (
    <>
      {/* ---------- MI CUENTA ---------- */}
      <h1 className="titulo-seccion">Mi cuenta</h1>

      <div className="tarjeta" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src={brandingAssets.logo} alt="DouPiggy" style={{ width: 56, height: 56, objectFit: "contain" }} />
        <div>
          <h2 style={{ margin: 0 }}>DouPiggy</h2>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--burnt)" }}>
            Tu chanchito lleva la cuenta clara del grupo.
          </p>
        </div>
      </div>

      <div className="tarjeta">
        <span className="etiqueta">Tu perfil</span>
        <div className="fila-perfil">
          <div className="avatar">{iniciales}</div>
          <div>
            <h2 style={{ margin: 0 }}>{nombre || "Sin nombre"}</h2>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--burnt)" }}>
              {perfil?.esAnonimo ? "Invitado" : "Cuenta de Google"}
            </p>
          </div>
        </div>

        <form onSubmit={guardarPerfil}>
          <label className="campo">Nombre</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />

          <label className="campo">Correo</label>
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />

          <p style={{ margin: "10px 0 0", fontSize: 11, fontWeight: 700, color: "var(--burnt)" }}>
            Completá CBU o alias (con uno de los dos alcanza para cobrar).
          </p>

          <label className="campo">CBU</label>
          <input
            type="text"
            value={cbu}
            maxLength={22}
            placeholder="22 dígitos"
            className={cbuInvalido ? "invalido" : ""}
            onChange={(e) => setCbu(e.target.value.replace(/\D/g, ""))}
            onBlur={() => setTocado((t) => ({ ...t, cbu: true }))}
          />
          {cbuInvalido && <p className="ayuda-error">El CBU debe tener 22 dígitos.</p>}

          <label className="campo">Alias</label>
          <input
            type="text"
            value={alias}
            placeholder="ej: gastos.depto.retro"
            className={aliasInvalido ? "invalido" : ""}
            onChange={(e) => setAlias(e.target.value)}
            onBlur={() => setTocado((t) => ({ ...t, alias: true }))}
          />
          {aliasInvalido && <p className="ayuda-error">El alias debe tener al menos 6 caracteres.</p>}
          {faltanAmbos && <p className="ayuda-error">Completá al menos uno de los dos: CBU o alias.</p>}

          {mensaje && (
            <p className="ayuda-error" style={{ color: mensaje.tipo === "ok" ? "var(--avocado)" : "var(--burnt)" }}>
              {mensaje.texto}
            </p>
          )}

          <button type="submit" className="btn bloque" style={{ marginTop: 12 }} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar perfil"}
          </button>
        </form>
      </div>

      {/* ---------- MIS GRUPOS ---------- */}
      <h1 className="titulo-seccion">Mis grupos</h1>

      <div className="tarjeta">
        <span className="etiqueta">Grupos</span>
        {grupos.length > 1 && (
          <>
            <label className="campo">Grupo activo</label>
            <select value={grupoId} onChange={(e) => onCambiarGrupo?.(e.target.value)}>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                </option>
              ))}
            </select>
          </>
        )}
        <h2 style={{ marginTop: grupos.length > 1 ? 12 : 0 }}>¿Otro grupo de gastos?</h2>
        <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "var(--burnt)" }}>
          Creá un grupo nuevo (ej. para otro depto, un viaje, la familia) sin perder este.
        </p>
        <button type="button" className="btn secundario bloque" onClick={() => setModalGrupoAbierto(true)}>
          Crear otro grupo
        </button>
      </div>

      {/* ---------- INFORMES ---------- */}
      <h1 className="titulo-seccion">Informes</h1>

      <div className="tarjeta">
        <span className="etiqueta">PDF / Excel</span>
        <h2 style={{ margin: 0 }}>Se generan desde Gastos</h2>
        <p style={{ margin: "6px 0 12px", fontSize: 13, fontWeight: 700, color: "var(--burnt)" }}>
          Elegís el rango de fechas junto al historial del grupo activo.
        </p>
        <button type="button" className="btn secundario bloque" onClick={onIrAGastos} disabled={!onIrAGastos}>
          Ir a Gastos
        </button>
      </div>

      {/* ---------- CONFIGURACIÓN ---------- */}
      <h1 className="titulo-seccion">Configuración</h1>

      <div className="tarjeta">
        <span className="etiqueta">Apariencia</span>
        <div className="switch-wrap">
          <div>
            <h2 style={{ margin: 0 }}>Modo {modoOscuro ? "noche" : "día"}</h2>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--burnt)" }}>
              Cambia la paleta de toda la app.
            </p>
          </div>
          <button
            type="button"
            className={`switch-astro${modoOscuro ? " noche" : ""}`}
            aria-label={modoOscuro ? "Cambiar a modo día" : "Cambiar a modo noche"}
            onClick={alternarModo}
          >
            <span className="astro-icono">{modoOscuro ? <IconoLuna tamano={22} /> : <IconoSol tamano={22} />}</span>
          </button>
        </div>
      </div>

      {modalGrupoAbierto && (
        <div
          className="modal-fondo"
          onClick={() => {
            setModalGrupoAbierto(false);
            setGrupoRecienCreadoId(null);
          }}
        >
          <div className="modal" role="dialog" aria-modal="true" aria-label="Grupo" onClick={(e) => e.stopPropagation()}>
            {grupoRecienCreadoId ? (
              <>
                <h3>Grupo creado — invitá a tu gente</h3>
                <InvitarGrupo grupoId={grupoRecienCreadoId} uidActual={uidActual} />
                <div className="modal-acciones">
                  <button
                    type="button"
                    className="btn chico bloque"
                    onClick={() => {
                      setModalGrupoAbierto(false);
                      setGrupoRecienCreadoId(null);
                      setMensaje({ tipo: "ok", texto: "Grupo creado" });
                    }}
                  >
                    Listo
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Crear otro grupo</h3>
                <form onSubmit={crearOtroGrupo}>
                  <label className="campo">Nombre del grupo</label>
                  <input
                    type="text"
                    value={nombreNuevoGrupo}
                    onChange={(e) => setNombreNuevoGrupo(e.target.value)}
                    placeholder="Ej: Viaje a Bariloche"
                    required
                    autoFocus
                  />
                  {errorGrupo && <p className="ayuda-error">{errorGrupo}</p>}
                  <div className="modal-acciones">
                    <button
                      type="button"
                      className="btn chico secundario"
                      onClick={() => setModalGrupoAbierto(false)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn chico bloque" disabled={creandoGrupo}>
                      {creandoGrupo ? "Creando..." : "Crear grupo"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
