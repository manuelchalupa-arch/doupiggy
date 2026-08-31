// components/InfoProfile.jsx
// Perfil del usuario (avatar, nombre, correo, CBU/alias mutuamente
// opcionales) y gestión de grupos. El apartado de invitar vive en Gastos.
//
// Cambios de esta ronda:
//   - Se sacó la tarjeta de branding ("DouPiggy" + logo) que abría la
//     pantalla: ahora "Mi cuenta" arranca directo en la tarjeta de perfil.
//   - Selector de avatar: solo avatares preset (hoy 2, pensado para crecer
//     a 4-6). Sin "Subir foto": no se guardan imágenes propias, se eligen
//     cerditos predefinidos para no depender de almacenamiento extra.
//   - "Informes" ahora manda a Resumen (el generador se movió ahí).
//   - "Configuración" quedó reducida al selector Sol/Luna sin tarjeta ni
//     texto explicativo alrededor.

import { useMemo, useState } from "react";
import {
  actualizarPerfil,
  actualizarFotoPerfil,
  esCbuValido,
  esAliasValido,
} from "../services/profileService";
import { crearGrupo, agregarMiembroLocal, eliminarMiembroLocal, eliminarGrupo } from "../services/groupService";
import { useTheme } from "../context/ThemeContext";
import { avatarAssets } from "../assets";
import InvitarGrupo from "./InvitarGrupo";
import InstalarApp from "./InstalarApp";
import { IconoSol, IconoLuna } from "./IconoAstro";
import { IconoTrash, IconoAgregarLocal, IconoCrearGrupo } from "./IconosRaster";

/** Resuelve el valor guardado en perfil.foto a una URL de imagen mostrable.
 *  Los presets se guardan como "preset:<id>" (no la URL final del bundle,
 *  que cambia de hash en cada build) y se resuelven acá contra avatarAssets.
 *  Una foto subida por el usuario ya es un data URL completo, se usa tal cual. */
function resolverFoto(foto) {
  if (!foto) return null;
  if (foto.startsWith("preset:")) {
    const id = foto.slice("preset:".length);
    return avatarAssets.find((a) => a.id === id)?.src ?? null;
  }
  return foto;
}

/**
 * @param {object} props
 * @param {string} props.uidActual
 * @param {object} props.perfil
 * @param {string} props.grupoId
 * @param {Array} [props.grupos]
 * @param {(id: string) => void} [props.onCambiarGrupo]
 */
export default function InfoProfile({ uidActual, perfil, grupoId, grupos = [], onCambiarGrupo }) {
  const { modoOscuro, alternarModo } = useTheme();
  const [nombre, setNombre] = useState(perfil?.nombre ?? "");
  const [correo, setCorreo] = useState(perfil?.correoContacto ?? perfil?.email ?? "");
  const [cbu, setCbu] = useState(perfil?.datosCobro?.cbu ?? "");
  const [alias, setAlias] = useState(perfil?.datosCobro?.alias ?? "");
  const [tocado, setTocado] = useState({ cbu: false, alias: false });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const [foto, setFoto] = useState(perfil?.foto ?? null);
  const [errorAvatar, setErrorAvatar] = useState(null);
  const [presetAbierto, setPresetAbierto] = useState(false);

  const [nombreMiembroLocal, setNombreMiembroLocal] = useState("");
  const [agregandoMiembroLocal, setAgregandoMiembroLocal] = useState(false);
  const [errorMiembroLocal, setErrorMiembroLocal] = useState(null);

  const [modalGrupoAbierto, setModalGrupoAbierto] = useState(false);
  const [nombreNuevoGrupo, setNombreNuevoGrupo] = useState("");
  const [creandoGrupo, setCreandoGrupo] = useState(false);
  const [errorGrupo, setErrorGrupo] = useState(null);
  const [grupoRecienCreadoId, setGrupoRecienCreadoId] = useState(null);
  const [borrandoGrupo, setBorrandoGrupo] = useState(false);

  const cbuInvalido = tocado.cbu && cbu.trim() !== "" && !esCbuValido(cbu);
  const aliasInvalido = tocado.alias && alias.trim() !== "" && !esAliasValido(alias);
  const faltanAmbos = tocado.cbu && tocado.alias && cbu.trim() === "" && alias.trim() === "";

  const iniciales = (nombre || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const fotoResuelta = resolverFoto(foto);

  async function elegirAvatarPreset(id) {
    setErrorAvatar(null);
    const valor = `preset:${id}`;
    try {
      await actualizarFotoPerfil(uidActual, valor);
      setFoto(valor);
    } catch (err) {
      setErrorAvatar(err.message ?? "No se pudo guardar el avatar.");
    }
  }

  // Miembros del grupo activo: reales (Google) + locales/temporales,
  // combinados en una sola lista para mostrar en la UI. `grupos` ya trae
  // el documento completo de cada grupo (incluido miembrosInfo), así que
  // no hace falta pedirle nada aparte a Firestore.
  const grupoActivo = grupos.find((g) => g.id === grupoId);
  // Solo el creador puede borrar el grupo: las reglas de Firestore rechazan
  // el borrado al resto, así que el botón se ofusca para quien no puede.
  const soyCreadorDelGrupo = grupoActivo?.creadoPor === uidActual;
  const miembrosDelGrupo = useMemo(() => {
    if (!grupoActivo?.miembrosInfo) return [];
    return Object.entries(grupoActivo.miembrosInfo).map(([uid, info]) => ({
      uid,
      nombre: info.nombre,
      esLocal: !!info.esLocal,
    }));
  }, [grupoActivo]);

  async function manejarAgregarMiembroLocal(evento) {
    evento.preventDefault();
    if (!nombreMiembroLocal.trim()) return;
    setErrorMiembroLocal(null);
    setAgregandoMiembroLocal(true);
    try {
      await agregarMiembroLocal(grupoId, nombreMiembroLocal.trim());
      setNombreMiembroLocal("");
    } catch (err) {
      setErrorMiembroLocal(err.message ?? "No se pudo agregar el miembro.");
    } finally {
      setAgregandoMiembroLocal(false);
    }
  }

  async function manejarEliminarMiembroLocal(idLocal, nombreVisible) {
    if (!window.confirm(`¿Quitar a ${nombreVisible} del grupo?`)) return;
    try {
      await eliminarMiembroLocal(grupoId, idLocal);
    } catch (err) {
      setErrorMiembroLocal(err.message ?? "No se pudo quitar el miembro.");
    }
  }

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
        fotoCreador: fotoResuelta,
      });
      setGrupoRecienCreadoId(grupoIdNuevo);
      setNombreNuevoGrupo("");
    } catch (err) {
      setErrorGrupo(err.message);
    } finally {
      setCreandoGrupo(false);
    }
  }

  async function manejarBorrarGrupo() {
    const nombreGrupo = grupoActivo?.nombre ?? "este grupo";
    if (!window.confirm(`¿Borrar "${nombreGrupo}" para todos? Se eliminan sus gastos definitivamente.`)) return;
    setErrorGrupo(null);
    setBorrandoGrupo(true);
    try {
      await eliminarGrupo(grupoId);
      onCambiarGrupo?.(null);
    } catch (err) {
      setErrorGrupo(err.message ?? "No se pudo borrar el grupo.");
    } finally {
      setBorrandoGrupo(false);
    }
  }

  return (
    <>
      {/* ---------- MI CUENTA ---------- */}
      <h1 className="titulo-seccion">Mi cuenta</h1>

      <div className="tarjeta-flotante">
        <div className="avatar-centro">
          <div className="avatar-grande">
            {fotoResuelta ? (
              <img src={fotoResuelta} alt="Tu avatar" />
            ) : (
              <div className="avatar">{iniciales}</div>
            )}
          </div>

          {/* Selector de avatares preset. Para agregar más (hoy hay 2, admite
              hasta 6): guardá el .webp cuadrado en src/assets/sprites/ y
              agregalo al array avatarAssets en src/assets/index.js — este
              desplegable lee de ahí solo. */}
          <div className="avatar-preset-dropdown">
            <button
              type="button"
              className="btn chico secundario avatar-preset-toggle"
              onClick={() => setPresetAbierto((v) => !v)}
              aria-expanded={presetAbierto}
            >
              Cerdito ▾
            </button>
            {presetAbierto && (
              <ul className="avatar-preset-lista" role="listbox">
                {avatarAssets
                  .filter((a) => a.src && a.alt) // defensivo: nunca renderiza una opción sin nombre/imagen
                  .map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className={`avatar-preset-item${foto === `preset:${a.id}` ? " sel" : ""}`}
                      role="option"
                      aria-selected={foto === `preset:${a.id}`}
                      aria-label={a.alt}
                      onClick={() => {
                        elegirAvatarPreset(a.id);
                        setPresetAbierto(false);
                      }}
                    >
                      <img src={a.src} alt="" loading="lazy" decoding="async" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {errorAvatar && <p className="ayuda-error">{errorAvatar}</p>}

        <form onSubmit={guardarPerfil}>
          <label className="campo">Nombre</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />

          <label className="campo">Correo electrónico</label>
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />

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

          <button type="submit" className="btn accion bloque" style={{ marginTop: 12 }} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </form>
      </div>

      {/* ---------- MIEMBROS DEL GRUPO ---------- */}
      {/* Dos formas de sumar gente al grupo, claramente separadas:
          1) Invitación online: la persona entra con su cuenta de Google
             (enlace compartible, ver InvitarGrupo).
          2) Miembro local/temporal: alguien sin cuenta, para trackear
             gastos que pagó o le corresponden sin que use la app. Se
             puede borrar cuando quieras (no borra los gastos ya
             cargados, solo deja de aparecer como opción a futuro). */}
      <h1 className="titulo-seccion">Miembros</h1>

      <div className="tarjeta-flotante">
        <ul className="lista-miembros">
          {miembrosDelGrupo.map((m) => (
            <li key={m.uid} className="lista-miembros-item">
              <span className="lista-miembros-nombre">{m.nombre}</span>
              <span className={`badge-miembro${m.esLocal ? " local" : ""}`}>
                {m.esLocal ? "Local" : "Google"}
              </span>
              {m.esLocal && (
                <button
                  type="button"
                  className="btn-borrar"
                  aria-label={`Quitar a ${m.nombre}`}
                  onClick={() => manejarEliminarMiembroLocal(m.uid, m.nombre)}
                >
                  <IconoTrash tamano={12} prohibido />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="tarjeta-flotante">
        <p style={{ margin: "4px 0 10px", fontSize: 12, fontWeight: 600, color: "var(--ink)", opacity: 0.8 }}>
          La persona entra con su cuenta de Google y queda como miembro real del grupo.
        </p>
        <InvitarGrupo grupoId={grupoId} uidActual={uidActual} />
      </div>

      <div className="tarjeta-flotante">
        <form onSubmit={manejarAgregarMiembroLocal}>
          <input
            type="text"
            value={nombreMiembroLocal}
            onChange={(e) => setNombreMiembroLocal(e.target.value)}
            placeholder="Nombre (ej: Tía Rosa)"
            required
          />
          {errorMiembroLocal && <p className="ayuda-error">{errorMiembroLocal}</p>}
          <button
            type="submit"
            className="btn accion bloque"
            style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            disabled={agregandoMiembroLocal}
          >
            <IconoAgregarLocal tamano={16} />
            {agregandoMiembroLocal ? "Agregando..." : "Agregar miembro local"}
          </button>
        </form>
      </div>

      {/* ---------- MIS GRUPOS ---------- */}
      <h1 className="titulo-seccion">Mis grupos</h1>

      <div className="tarjeta-flotante">
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
        <button
          type="button"
          className="btn accion bloque"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          onClick={() => setModalGrupoAbierto(true)}
        >
          <IconoCrearGrupo tamano={16} />
          Crear otro grupo
        </button>

        {soyCreadorDelGrupo ? (
          <>
            <button
              type="button"
              className="btn peligro chico bloque"
              style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              disabled={borrandoGrupo}
              onClick={manejarBorrarGrupo}
            >
              <IconoTrash tamano={14} prohibido />
              {borrandoGrupo ? "Borrando..." : "Borrar este grupo"}
            </button>
            {errorGrupo && <p className="ayuda-error">{errorGrupo}</p>}
          </>
        ) : (
          <p style={{ margin: "8px 0 0", fontSize: 11, fontWeight: 700, color: "var(--ink)", opacity: 0.6 }}>
            Solo quien creó el grupo puede borrarlo.
          </p>
        )}
      </div>

      {/* ---------- CONFIGURACIÓN ---------- */}
      {/* Modo día/noche + instalación PWA, fuera de la vista de las demás
          pestañas (antes flotaban sobre toda la app). */}
      <h1 className="titulo-seccion">Configuración</h1>

      <div className="tarjeta-flotante">
        <div className="fila-configuracion">
          <button
            type="button"
            className="boton-icono"
            aria-label={modoOscuro ? "Pasar a modo día" : "Pasar a modo noche"}
            title={modoOscuro ? "Pasar a modo día" : "Pasar a modo noche"}
            onClick={alternarModo}
          >
            {modoOscuro ? <IconoLuna tamano={22} /> : <IconoSol tamano={22} />}
          </button>
          <InstalarApp />
        </div>
      </div>

      {/* La sección "Informes" se sacó de acá por completo (queda solo en
          Resumen, que es donde vive el generador real). */}

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
                    <button
                      type="submit"
                      className="btn chico accion"
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                      disabled={creandoGrupo}
                    >
                      <IconoCrearGrupo tamano={14} />
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
