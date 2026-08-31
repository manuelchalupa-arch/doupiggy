// App.jsx
// Punto de entrada visual. Orquesta: splash -> ¿hay un token de invitación
// en la URL? -> estado de auth real -> grupo (crear si no tiene ninguno /
// elegir si tiene varios) -> AppShell.
// Sin lógica de negocio propia: todo se delega a los hooks/servicios ya
// construidos en los Bloques 1-5.

import { useEffect, useState } from "react";
import "./styles/theme.css";
import { ThemeProvider } from "./context/ThemeContext";
import SplashScreen from "./components/SplashScreen";
import AppShell from "./components/AppShell";
import CrearGrupoScreen from "./components/CrearGrupoScreen";
import InvitarTrasCrear from "./components/InvitarTrasCrear";
import { useAuthState } from "./hooks/useAuthState";
import { suscribirseAGruposDeUsuario } from "./services/groupService";
import { iniciarSesionConGoogle, iniciarSesionConEmail, registrarseConEmail, traducirErrorLogin, unirseComoInvitado } from "./services/authService";
import { actualizarPerfil, esAliasValido } from "./services/profileService";

// Se lee una sola vez al cargar el módulo: si hay ?invite=TOKEN en la URL,
// se guarda acá y se limpia de la barra de direcciones inmediatamente
// (para que un refresh de página no dispare la aceptación de nuevo).
function leerYLimpiarTokenDeInvitacion() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("invite");
  if (token) {
    params.delete("invite");
    const resto = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (resto ? `?${resto}` : ""));
  }
  return token;
}

export default function App() {
  const [mostrarSplash, setMostrarSplash] = useState(true);
  const [tokenInvitacion] = useState(leerYLimpiarTokenDeInvitacion);
  const [aceptandoInvitacion, setAceptandoInvitacion] = useState(!!tokenInvitacion);
  const [errorInvitacion, setErrorInvitacion] = useState(null);
  const [grupoDeInvitacionId, setGrupoDeInvitacionId] = useState(null);
  // Después de aceptar la invitación (Google ya autenticado), se pide un
  // registro breve (nombre + alias) antes de entrar al grupo. Guarda acá
  // el usuario de Google recién autenticado mientras se completa ese paso.
  const [usuarioInvitadoPendiente, setUsuarioInvitadoPendiente] = useState(null);

  const { usuario, perfil, estaAutenticado, cargando } = useAuthState();
  const [grupos, setGrupos] = useState([]);
  const [cargandoGrupos, setCargandoGrupos] = useState(true);
  const [grupoSeleccionadoId, setGrupoSeleccionadoId] = useState(null);
  const [errorGrupos, setErrorGrupos] = useState(null);
  // Grupo recién creado que todavía no pasó por la pantalla de invitar.
  // Mientras tenga un valor, tiene prioridad sobre AppShell.
  const [grupoParaInvitarId, setGrupoParaInvitarId] = useState(null);

  useEffect(() => {
    if (!estaAutenticado) {
      setGrupos([]);
      setCargandoGrupos(true);
      setErrorGrupos(null);
      return undefined;
    }
    return suscribirseAGruposDeUsuario(
      usuario.uid,
      (lista) => {
        setErrorGrupos(null);
        setGrupos(lista);
        setCargandoGrupos(false);
        // Si venimos de aceptar una invitación, priorizar ESE grupo aunque
        // no sea el primero de la lista.
        setGrupoSeleccionadoId((actual) => {
          if (grupoDeInvitacionId && lista.some((g) => g.id === grupoDeInvitacionId)) {
            return grupoDeInvitacionId;
          }
          return lista.some((g) => g.id === actual) ? actual : lista[0]?.id ?? null;
        });
      },
      (error) => {
        setCargandoGrupos(false);
        setErrorGrupos(error);
      }
    );
  }, [estaAutenticado, usuario, grupoDeInvitacionId]);

  const grupoSeleccionado = grupos.find((g) => g.id === grupoSeleccionadoId) ?? null;

  async function manejarAceptarInvitacion() {
    setErrorInvitacion(null);
    try {
      const { user, grupoId } = await unirseComoInvitado(tokenInvitacion);
      setGrupoDeInvitacionId(grupoId);
      // No cerramos la pantalla de invitación todavía: primero pedimos el
      // registro breve (nombre + alias).
      setUsuarioInvitadoPendiente(user);
    } catch (err) {
      setErrorInvitacion(traducirErrorLogin(err));
    }
  }

  async function manejarRegistroInvitado({ nombre, alias }) {
    await actualizarPerfil(usuarioInvitadoPendiente.uid, {
      nombre,
      correoContacto: usuarioInvitadoPendiente.email ?? "",
      cbu: "",
      alias,
    });
    setUsuarioInvitadoPendiente(null);
    setAceptandoInvitacion(false);
  }

  if (mostrarSplash) {
    return <SplashScreen onFinish={() => setMostrarSplash(false)} />;
  }

  // Pantalla de aceptación de invitación: tiene prioridad sobre todo lo
  // demás mientras haya un token pendiente y el usuario no haya decidido
  // "continuar sin unirme".
  if (aceptandoInvitacion && tokenInvitacion) {
    return (
      <ThemeProvider>
        {usuarioInvitadoPendiente ? (
          <PantallaRegistroInvitado
            nombreInicial={usuarioInvitadoPendiente.displayName ?? ""}
            onConfirmar={manejarRegistroInvitado}
          />
        ) : (
          <PantallaInvitacion
            onAceptar={manejarAceptarInvitacion}
            onOmitir={() => setAceptandoInvitacion(false)}
            error={errorInvitacion}
          />
        )}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      {cargando ? (
        <PantallaCarga texto="Cargando tu sesión..." />
      ) : !estaAutenticado ? (
        <PantallaLogin />
      ) : errorGrupos ? (
        <PantallaError error={errorGrupos} />
      ) : cargandoGrupos ? (
        <PantallaCarga texto="Buscando tus grupos..." />
      ) : grupoParaInvitarId ? (
        <InvitarTrasCrear
          grupoId={grupoParaInvitarId}
          uidActual={usuario.uid}
          onContinuar={() => {
            setGrupoSeleccionadoId(grupoParaInvitarId);
            setGrupoParaInvitarId(null);
          }}
        />
      ) : grupos.length === 0 ? (
        <CrearGrupoScreen
          uidActual={usuario.uid}
          usuarioAuth={usuario}
          onCreado={setGrupoParaInvitarId}
        />
      ) : (
        <AppShell
          grupoId={grupoSeleccionado.id}
          grupo={grupoSeleccionado}
          uidActual={usuario.uid}
          perfil={perfil}
          grupos={grupos}
          onCambiarGrupo={setGrupoSeleccionadoId}
        />
      )}
    </ThemeProvider>
  );
}

/**
 * Pantalla que se muestra cuando la URL trae ?invite=TOKEN. Funciona tanto
 * si la persona ya tenía sesión iniciada (con OTRA cuenta de Google, se le
 * suma este grupo a los suyos) como si es la primera vez que entra.
 */
function PantallaInvitacion({ onAceptar, onOmitir, error }) {
  const [procesando, setProcesando] = useState(false);

  async function manejarClick() {
    setProcesando(true);
    await onAceptar();
    setProcesando(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
      <div className="tarjeta" style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
        <h2>Te invitaron a un grupo de DouPiggy</h2>
        <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
          Ingresá con tu cuenta de Google para sumarte. Vas a poder seguir usando
          o creando tus propios grupos sin problema — este se agrega a los tuyos,
          no lo reemplaza.
        </p>
        <button type="button" className="btn accion bloque" onClick={manejarClick} disabled={procesando}>
          {procesando ? "Uniéndote..." : "Ingresar con Google y unirme"}
        </button>
        {error && <p className="ayuda-error" style={{ marginTop: 10 }}>{error}</p>}
        <button type="button" className="btn secundario bloque" style={{ marginTop: 10 }} onClick={onOmitir}>
          Ahora no
        </button>
      </div>
    </div>
  );
}

/**
 * Formulario breve para usuarios invitados: se muestra una sola vez, justo
 * después de aceptar la invitación (Google ya autenticado). Pide nombre
 * (pre-cargado con el de Google, editable) y alias de cobro — es el dato
 * mínimo para poder participar y eventualmente cobrar dentro del grupo.
 * Reusa profileService.actualizarPerfil, así que las mismas validaciones
 * de siempre aplican (alias: 6+ caracteres).
 */
function PantallaRegistroInvitado({ nombreInicial, onConfirmar }) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [alias, setAlias] = useState("");
  const [tocado, setTocado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const aliasInvalido = tocado && alias.trim() !== "" && !esAliasValido(alias);
  const aliasVacio = tocado && alias.trim() === "";

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setTocado(true);
    if (!nombre.trim() || !esAliasValido(alias)) return;
    setError(null);
    setEnviando(true);
    try {
      await onConfirmar({ nombre: nombre.trim(), alias: alias.trim() });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
      <div className="tarjeta" style={{ width: "100%", maxWidth: 360 }}>
        <h2>Completá tu registro</h2>
        <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
          Ya te uniste al grupo. Con esto terminamos.
        </p>
        <form onSubmit={manejarEnvio}>
          <label className="campo">Nombre</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />

          <label className="campo">Alias (para cobrar/pagar dentro del grupo)</label>
          <input
            type="text"
            value={alias}
            placeholder="ej: juan.gastos.retro"
            className={aliasInvalido || aliasVacio ? "invalido" : ""}
            onChange={(e) => setAlias(e.target.value)}
            onBlur={() => setTocado(true)}
          />
          {aliasVacio && <p className="ayuda-error">El alias es obligatorio para continuar.</p>}
          {!aliasVacio && aliasInvalido && <p className="ayuda-error">El alias debe tener al menos 6 caracteres.</p>}
          {error && <p className="ayuda-error">{error}</p>}

          <button type="submit" className="btn accion bloque" style={{ marginTop: 12 }} disabled={enviando}>
            {enviando ? "Guardando..." : "Confirmar y entrar al grupo"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PantallaCarga({ texto }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--ink)" }}>{texto}</p>
    </div>
  );
}

function PantallaError({ error }) {
  const esPermisos = error?.code === "permission-denied";
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, textAlign: "center" }}>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--burnt)" }}>
        No se pudo conectar con la base de datos
      </p>
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", maxWidth: 320 }}>
        {esPermisos
          ? "Firestore rechazó el pedido por permisos. Revisá que publicaste las reglas de seguridad (firebase/firestore.rules) en Firebase Console > Firestore Database > Rules."
          : `Código de error: ${error?.code ?? "desconocido"}. Revisá que Firestore Database esté creado en Firebase Console.`}
      </p>
      <button className="btn" onClick={() => window.location.reload()}>
        Reintentar
      </button>
    </div>
  );
}

function PantallaLogin() {
  const [modo, setModo] = useState("ingresar"); // "ingresar" | "registro"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

  async function manejarIngreso() {
    if (procesando) return;
    setError(null);
    setProcesando(true);
    try {
      await iniciarSesionConGoogle();
    } catch (err) {
      setError(traducirErrorLogin(err));
    } finally {
      setProcesando(false);
    }
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    if (procesando) return;
    setError(null);
    setProcesando(true);
    try {
      if (modo === "registro") {
        if (!nombre.trim()) throw new Error("Escribí tu nombre para crear la cuenta.");
        await registrarseConEmail({ email, password, nombre: nombre.trim() });
      } else {
        await iniciarSesionConEmail({ email, password });
      }
    } catch (err) {
      setError(traducirErrorLogin(err));
    } finally {
      setProcesando(false);
    }
  }

  function cambiarModo() {
    setModo(modo === "registro" ? "ingresar" : "registro");
    setError(null);
  }

  const esRegistro = modo === "registro";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
      <h1 style={{ fontSize: 20, textAlign: "center" }}>DouPiggy</h1>

      <div className="tarjeta" style={{ width: "100%", maxWidth: 340 }}>
        <button className="btn accion bloque" onClick={manejarIngreso} disabled={procesando}>
          {procesando ? "Conectando..." : "Ingresar con Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
          <span style={{ flex: 1, height: 1, background: "var(--border-color, rgba(0,0,0,0.25))" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)", opacity: 0.7 }}>
            {esRegistro ? "o registrate" : "o entrá con correo"}
          </span>
          <span style={{ flex: 1, height: 1, background: "var(--border-color, rgba(0,0,0,0.25))" }} />
        </div>

        <form onSubmit={manejarEnvio}>
          {esRegistro && (
            <>
              <label className="campo">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Cómo te llamás?"
              />
            </>
          )}
          <label className="campo">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            required
          />
          <label className="campo">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={esRegistro ? "new-password" : "current-password"}
            required
          />
          {error && <p className="ayuda-error" style={{ marginTop: 8 }}>{error}</p>}
          <button type="submit" className="btn principal bloque" style={{ marginTop: 12 }} disabled={procesando}>
            {procesando ? "Conectando..." : esRegistro ? "Crear cuenta y entrar" : "Ingresar"}
          </button>
        </form>

        <button type="button" className="btn secundario bloque" style={{ marginTop: 10 }} onClick={cambiarModo}>
          {esRegistro ? "Ya tengo cuenta: ingresar" : "¿Primera vez? Creá una cuenta"}
        </button>
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", opacity: 0.75, textAlign: "center", margin: 0 }}>
        ¿Te invitaron a un grupo? Abrí el enlace de invitación que te compartieron.
      </p>
    </div>
  );
}
