# Estructura de la base de datos (Firestore)

Diseño pensado para: (1) aislamiento estricto entre usuarios/grupos ajenos,
(2) lecturas baratas en modo offline-first (documentos autocontenidos,
poca necesidad de joins), (3) escalabilidad de un grupo con N miembros y M gastos.

## Colecciones raíz

### `usuarios/{uid}`
Perfil del usuario autenticado (Google) o anónimo (invitado).
```
{
  uid: string,              // = auth.uid, también es el id del doc
  nombre: string,
  email: string | null,     // null si es anónimo
  foto: string | null,
  esAnonimo: boolean,
  gruposIds: string[],      // desnormalizado para listar "mis grupos" sin query costosa
  creadoEn: Timestamp,
  ultimaConexion: Timestamp
}
```

### `grupos/{grupoId}`
```
{
  nombre: string,
  moneda: "ARS",             // fijo por ahora, pero explícito para el futuro
  creadoPor: uid,
  miembros: string[],        // array de uids -> se usa en reglas de seguridad
  miembrosInfo: {            // desnormalizado: evita leer /usuarios por cada miembro
    [uid]: { nombre: string, foto: string | null, activo: boolean }
  },
  creadoEn: Timestamp,
  actualizadoEn: Timestamp
}
```
`miembros` (array) es la clave de la seguridad: las reglas comprueban
`request.auth.uid in resource.data.miembros`.

### `grupos/{grupoId}/gastos/{gastoId}` (subcolección)
```
{
  monto: number,             // en ARS, sin decimales de moneda extranjera
  descripcion: string,
  pagadoPor: uid,
  participantes: string[],   // uids entre los que se divide
  division: {                // monto que le corresponde a cada participante
    [uid]: number
  },
  tipoDivision: "igual" | "personalizada",
  creadoPor: uid,
  creadoEn: Timestamp,
  editadoEn: Timestamp | null
}
```

### `grupos/{grupoId}/prestamos/{prestamoId}` (subcolección)
Ver Bloque 5 (`services/loanService.js`) para el detalle de cuotas.
```
{
  montoTotal: number,
  prestamista: uid,
  prestatario: uid,
  descripcion: string,
  cuotas: [
    { numero: number, monto: number, pagada: boolean, pagadaEn: Timestamp | null }
  ],
  saldoPendiente: number,    // desnormalizado, se recalcula al pagar una cuota
  estado: "activo" | "saldado",
  creadoPor: uid,
  creadoEn: Timestamp
}
```

### `grupos/{grupoId}/pagos/{pagoId}` (subcolección)
Un registro por pago que el ACREEDOR de un par confirmó como recibido. Lo que
no está confirmado no se guarda: se deriva de los gastos (`calcularDeudas`).
```
{
  de: string,              // uid del que pagó (deudor del par)
  para: string,            // uid que cobró (== quien crea el registro)
  monto: number,
  confirmadoPor: uid,      // = para (auditoría de quién lo marcó)
  confirmadoEn: Timestamp | null,
  creadoEn: Timestamp
}
```

### `grupos/{grupoId}/liquidaciones/{liquidacionId}` (subcolección)
Snapshot inmutable de un cierre de liquidación (una por vez que se cierra).
```
{
  cerradoPor: uid,
  cerradoEn: Timestamp,
  creadoEn: Timestamp,
  total: number,           // total confirmado en ese cierre
  recibidos: [             // copia de los pagos confirmados al cerrar
    { de, deNombre, para, monto, confirmadoEn: Timestamp | null }
  ]
}
```

### `invitaciones/{token}`
Enlaces temporales para que invitados entren de forma anónima a un grupo
sin exponer el `grupoId` real en la URL más que a través del token.
```
{
  grupoId: string,
  creadoPor: uid,
  expiraEn: Timestamp,   // ej. ahora + 7 días
  usosMaximos: number | null,  // null = ilimitado hasta expirar
  usosActuales: number
}
```

## Por qué esta forma

- **Subcolecciones para gastos/préstamos**: crecen sin límite por grupo;
  mantenerlas fuera del documento `grupos/{id}` evita el límite de 1 MiB
  por documento y permite paginar/query por fecha eficientemente.
- **`miembros` como array plano en `grupos`**: es lo que permite escribir
  reglas de seguridad O(1) sin lecturas adicionales (`resource.data.miembros`).
- **Desnormalización de `miembrosInfo` y `gruposIds`**: modo offline-first
  significa minimizar la cantidad de documentos distintos que hace falta
  tener en caché para renderizar una pantalla.
- **`invitaciones` como colección separada**: permite reglas de seguridad
  independientes (cualquiera con el token puede *leer* la invitación para
  validar, pero no puede leer el grupo hasta ser agregado a `miembros`).
