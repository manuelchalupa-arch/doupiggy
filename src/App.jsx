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
import { iniciarSesionConGoogle, unirseComoInvitado } from "./services/authService";

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
      const { grupoId } = await unirseComoInvitado(tokenInvitacion);
      setGrupoDeInvitacionId(grupoId);
      setAceptandoInvitacion(false);
    } catch (err) {
      setErrorInvitacion(err.message);
    }
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
        <PantallaInvitacion
          onAceptar={manejarAceptarInvitacion}
          onOmitir={() => setAceptandoInvitacion(false)}
          error={errorInvitacion}
        />
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
        <span className="etiqueta">Invitación</span>
        <h2>Te invitaron a un grupo de DouPiggy</h2>
        <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: "var(--burnt)" }}>
          Ingresá con tu cuenta de Google para sumarte. Vas a poder seguir usando
          o creando tus propios grupos sin problema — este se agrega a los tuyos,
          no lo reemplaza.
        </p>
        <button type="button" className="btn bloque" onClick={manejarClick} disabled={procesando}>
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
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
      <h1 style={{ fontSize: 20, textAlign: "center" }}>DouPiggy</h1>
      <button className="btn" onClick={() => iniciarSesionConGoogle()}>
        Ingresar con Google
      </button>
      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--burnt)", textAlign: "center" }}>
        ¿Te invitaron a un grupo? Abrí el enlace de invitación que te compartieron.
      </p>
    </div>
  );
}
