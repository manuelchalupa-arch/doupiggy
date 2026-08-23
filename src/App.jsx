// App.jsx
// Punto de entrada visual. Orquesta: splash -> estado de auth real ->
// grupo (crear si no tiene ninguno / elegir si tiene varios) -> AppShell.
// Sin lógica de negocio propia: todo se delega a los hooks/servicios ya
// construidos en los Bloques 1-5.

import { useEffect, useState } from "react";
import "./styles/theme.css";
import { ThemeProvider } from "./context/ThemeContext";
import SplashScreen from "./components/SplashScreen";
import AppShell from "./components/AppShell";
import CrearGrupoScreen from "./components/CrearGrupoScreen";
import { useAuthState } from "./hooks/useAuthState";
import { suscribirseAGruposDeUsuario } from "./services/groupService";
import { iniciarSesionConGoogle } from "./services/authService";

export default function App() {
  const [mostrarSplash, setMostrarSplash] = useState(true);
  const { usuario, perfil, estaAutenticado, cargando } = useAuthState();
  const [grupos, setGrupos] = useState([]);
  const [cargandoGrupos, setCargandoGrupos] = useState(true);
  const [grupoSeleccionadoId, setGrupoSeleccionadoId] = useState(null);
  const [errorGrupos, setErrorGrupos] = useState(null);

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
        // Si el grupo seleccionado ya no está en la lista (o todavía no hay
        // ninguno elegido), se elige el primero disponible automáticamente.
        setGrupoSeleccionadoId((actual) =>
          lista.some((g) => g.id === actual) ? actual : lista[0]?.id ?? null
        );
      },
      (error) => {
        setCargandoGrupos(false);
        setErrorGrupos(error);
      }
    );
  }, [estaAutenticado, usuario]);

  const grupoSeleccionado = grupos.find((g) => g.id === grupoSeleccionadoId) ?? null;

  if (mostrarSplash) {
    return <SplashScreen onFinish={() => setMostrarSplash(false)} />;
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
      ) : grupos.length === 0 ? (
        <CrearGrupoScreen uidActual={usuario.uid} usuarioAuth={usuario} />
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
