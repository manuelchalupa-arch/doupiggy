// components/InfoProfile.jsx
// Perfil del usuario (nombre, correo, CBU/alias mutuamente opcionales),
// generación de informes por rango de fechas (Excel o PDF) y el switch de
// modo oscuro (que solo ajusta brillo, ver context/ThemeContext.jsx).

import { useMemo, useState } from "react";
import { actualizarPerfil, esCbuValido, esAliasValido } from "../services/profileService";
import { generarInformeExcel, generarInformePdf } from "../services/reportService";
import { crearGrupo } from "../services/groupService";
import { useTheme } from "../context/ThemeContext";
import CalendarioRango from "./CalendarioRango";
import { brandingAssets, backgroundAssets, iconAssets } from "../assets";
import InvitarGrupo from "./InvitarGrupo";

/**
 * @param {object} props
 * @param {string} props.uidActual
 * @param {object} props.perfil - documento de /usuarios del usuario actual
 * @param {string} props.grupoId
 * @param {Array} props.gastos - gastos del grupo (de useExpenses), para el informe
 * @param {Array<{uid:string,nombre:string}>} [props.miembros]
 */
export default function InfoProfile({ uidActual, perfil, gastos, miembros = [] }) {
  const { modoOscuro, alternarModo } = useTheme();

  const [nombre, setNombre] = useState(perfil?.nombre ?? "");
  const [correo, setCorreo] = useState(perfil?.correoContacto ?? perfil?.email ?? "");
  const [cbu, setCbu] = useState(perfil?.datosCobro?.cbu ?? "");
  const [alias, setAlias] = useState(perfil?.datosCobro?.alias ?? "");
  const [tocado, setTocado] = useState({ cbu: false, alias: false });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [rangoDesde, setRangoDesde] = useState(null);
  const [rangoHasta, setRangoHasta] = useState(null);

  const [modalGrupoAbierto, setModalGrupoAbierto] = useState(false);
  const [nombreNuevoGrupo, setNombreNuevoGrupo] = useState("");
  const [creandoGrupo, setCreandoGrupo] = useState(false);
  const [errorGrupo, setErrorGrupo] = useState(null);
  const [grupoRecienCreadoId, setGrupoRecienCreadoId] = useState(null);

  // CBU y alias son mutuamente opcionales: alcanza con completar uno de los
  // dos. Cada campo solo se marca inválido si tiene contenido con formato
  // incorrecto; el error de "falta al menos uno" se muestra una sola vez,
  // no duplicado en los dos campos.
  const cbuInvalido = tocado.cbu && cbu.trim() !== "" && !esCbuValido(cbu);
  const aliasInvalido = tocado.alias && alias.trim() !== "" && !esAliasValido(alias);
  const faltanAmbos = tocado.cbu && tocado.alias && cbu.trim() === "" && alias.trim() === "";

  const nombrePorUid = useMemo(() => {
    const mapa = { [uidActual]: nombre || "Vos" };
    for (const m of miembros) mapa[m.uid] = m.nombre;
    return mapa;
  }, [miembros, uidActual, nombre]);

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

  function generar(formato) {
    if (!rangoDesde) return;
    const hasta = rangoHasta ?? rangoDesde;
    const generador = formato === "pdf" ? generarInformePdf : generarInformeExcel;
    try {
      const cantidad = generador(gastos, nombrePorUid, rangoDesde, hasta);
      setModalAbierto(false);
      setMensaje({
        tipo: "ok",
        texto: cantidad > 0 ? `Informe ${formato.toUpperCase()} generado (${cantidad} gastos)` : "No hubo gastos en ese rango",
      });
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
    }
  }

  async function crearOtroGrupo(evento) {
    evento.preventDefault();
    if (!nombreNuevoGrupo.trim()) return;
    setErrorGrupo(null);
    setCreandoGrupo(true);
    try {
      const grupoId = await crearGrupo({
        nombre: nombreNuevoGrupo.trim(),
        creadoPor: uidActual,
        nombreCreador: perfil?.nombre ?? nombre ?? "Vos",
        fotoCreador: perfil?.foto ?? null,
      });
      // La suscripción en tiempo real de App.jsx detecta el grupo nuevo sola
      // y lo suma al selector del header — no hace falta redirigir a mano.
      // El modal se queda abierto un paso más, mostrando "Invitar" en el
      // acto en vez de cerrarse solo.
      setGrupoRecienCreadoId(grupoId);
      setNombreNuevoGrupo("");
    } catch (err) {
      setErrorGrupo(err.message);
    } finally {
      setCreandoGrupo(false);
    }
  }

  return (
    <>
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

      <div className="tarjeta">
        <span className="etiqueta">Informes</span>
        <h2>Descargá tus gastos</h2>
        <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "var(--burnt)" }}>
          Elegí un rango de fechas del calendario.
        </p>
        <button
          type="button"
          className="btn secundario bloque"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          onClick={() => setModalAbierto(true)}
        >
          <img src={iconAssets.calendar} alt="" className="icono-inline" style={{ "--icon-size": "16px" }} />
          Generar informe
        </button>
      </div>

      <div className="tarjeta">
        <span className="etiqueta">Grupos</span>
        <h2>¿Otro grupo de gastos?</h2>
        <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "var(--burnt)" }}>
          Creá un grupo nuevo (ej. para otro depto, un viaje, la familia) sin
          perder este. Vas a poder cambiar entre grupos desde el header.
        </p>
        <button type="button" className="btn secundario bloque" onClick={() => setModalGrupoAbierto(true)}>
          Crear otro grupo
        </button>
      </div>

      <div className="tarjeta">
        <span className="etiqueta">Preferencias</span>
        <div className="switch-wrap">
          <div>
            <h2 style={{ margin: 0 }}>Modo oscuro</h2>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--burnt)" }}>
              Solo baja el brillo, no cambia colores.
            </p>
          </div>
          <div
            className={`switch${modoOscuro ? " on" : ""}`}
            role="switch"
            aria-checked={modoOscuro}
            tabIndex={0}
            onClick={alternarModo}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && alternarModo()}
          >
            <div className="bola" />
          </div>
        </div>
      </div>

      {modalAbierto && (
        <div className="modal-fondo" onClick={() => setModalAbierto(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundImage: `url(${backgroundAssets.report})`,
              backgroundSize: "140px",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "bottom right",
              backgroundBlendMode: "luminosity",
            }}
          >
            <h3>Elegí el rango del informe</h3>
            <CalendarioRango
              desde={rangoDesde}
              hasta={rangoHasta}
              onCambiarRango={(d, h) => {
                setRangoDesde(d);
                setRangoHasta(h);
              }}
            />
            <div className="modal-acciones">
              <button type="button" className="btn chico secundario" onClick={() => setModalAbierto(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn chico"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => generar("excel")}
                disabled={!rangoDesde}
              >
                <img src={iconAssets.excel} alt="" className="icono-inline" style={{ "--icon-size": "14px" }} />
                Excel
              </button>
              <button
                type="button"
                className="btn chico"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => generar("pdf")}
                disabled={!rangoDesde}
              >
                <img src={iconAssets.pdf} alt="" className="icono-inline" style={{ "--icon-size": "14px" }} />
                PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {modalGrupoAbierto && (
        <div
          className="modal-fondo"
          onClick={() => {
            setModalGrupoAbierto(false);
            setGrupoRecienCreadoId(null);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
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
