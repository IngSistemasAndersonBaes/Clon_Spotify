# Documentación Backend

## Resumen
API REST construida con Express y MySQL. Incluye autenticación JWT en cookie HttpOnly, protección CSRF, rate limit en login, manejo de errores centralizado, auditoría básica y rutas para usuarios, ventas, equipos, áreas y productos.

## Estructura de carpetas
- `backend/src/index.js`: Punto de entrada del servidor.
- `backend/src/app.js`: Configuración de Express (CORS, cookies, CSRF, rutas y errores).
- `backend/src/routes/`: Rutas del API.
- `backend/src/middlewares/`: Middlewares compartidos (auth, authorizeRoles, errorHandler, validate).
- `backend/src/db/`: Conexión a la base de datos.
- `backend/src/utils/`: Utilidades (fechas).

## Descripción de archivos
- `backend/src/index.js`: Carga variables de entorno y levanta el servidor en el puerto configurado.
- `backend/src/app.js`: Configura seguridad HTTP, CORS, cookies, CSRF, registra rutas y el manejador de errores.
- `backend/src/db/conexion.js`: Configura la conexión a MySQL y exporta el cliente para consultas.
- `backend/src/middlewares/auth.js`: Valida JWT, comprueba `token_version` y estado del usuario.
- `backend/src/middlewares/authorizeRoles.js`: Restringe rutas por rol (`administrador`, `trabajador`).
- `backend/src/middlewares/errorHandler.js`: Respuestas de error centralizadas.
- `backend/src/middlewares/validate.js`: Validación de `body` y `query` con Joi.
- `backend/src/routes/usuariosRoutes.js`: Login, logout y CRUD de usuarios.
- `backend/src/routes/productosRoutes.js`: CRUD de productos y búsqueda por código.
- `backend/src/routes/areasRoutes.js`: Consulta de áreas.
- `backend/src/routes/equiposRoutes.js`: Inventario de equipos, asignaciones y mantenimientos.
- `backend/src/routes/ventasRoutes.js`: Registro y consulta de ventas por rango de fechas.
- `backend/src/utils/date.js`: Formateo y parsing de fechas `YYYY-MM-DD`.

## Requisitos
- Node.js 18+
- MySQL

## Variables de entorno
Configurar en `backend/.env`:
- `PORT`: Puerto del servidor (default 3000).
- `DB_HOST`: Host MySQL.
- `DB_USER`: Usuario MySQL.
- `DB_PASSWORD`: Password MySQL.
- `DB_DATABASE`: Base de datos MySQL.
- `JWT_SECRET`: Secreto para firmar tokens JWT.
- `CORS_ORIGIN`: Origen permitido para CORS (ej. `http://localhost:5173`).
- `NODE_ENV`: `development` o `production`.

## Comandos previos (antes de iniciar el backend)
1. Instalar dependencias:
   ```bash
   cd backend
   npm install
   ```
2. Crear la base de datos e importar el esquema:
   ```bash
   # desde la raíz del proyecto
   mysql -u TU_USUARIO -p < db_inv_ti.sql
   ```
3. Verifica el archivo `backend/.env` con las credenciales correctas.

## Scripts
Desde `backend/`:
- `npm run dev`: Inicia el servidor con nodemon.

## Autenticación
- Todas las rutas (excepto `/login` y `/csrf-token`) requieren token JWT.
- El backend guarda el JWT en cookie HttpOnly.
- El cliente envía el token automáticamente en las cookies.
- En `logout` se incrementa `token_version` para invalidar tokens activos.

## Nuevo flujo con CSRF (obligatorio para POST/PUT/DELETE)
1. `GET /csrf-token`
   - Respuesta: `{ "csrfToken": "..." }`
2. En la siguiente request `POST/PUT/DELETE` enviar:
   - Header: `x-csrf-token: <token>`
   - Cookie: (automática desde el navegador o Postman)

## Roles
El sistema soporta roles:
- `administrador`: puede administrar usuarios.
- `trabajador`: acceso general a rutas protegidas.

Las rutas de usuarios (`/usuarios`) están restringidas a `administrador`.

## Endpoints

### Auth
- `GET /csrf-token`
- `POST /login`
  - Body:
    - `usuario` (string)
    - `contrasena` (string)
  - Respuesta:
    - `usuario` (objeto con `usuario`, `nombre`, `area`, `estado`, `rol`)

- `POST /logout`
  - Limpia la cookie `token` y revoca sesión.

### Usuarios (protegidas, solo administrador)
- `GET /usuarios`
- `POST /usuarios`
  - Body: `usuario`, `contrasena`, `nombre`, `area`, `correo`, `estado?`, `rol?`
- `PUT /usuarios/:usuario`
  - Body: `nombre`, `contrasena?`, `area`, `correo`, `estado`, `rol?`
- `DELETE /usuarios/:usuario`

### Áreas (protegidas)
- `GET /areas`

### Productos (protegidas)
- `GET /productos`
- `GET /producto?codigo=...`
- `POST /productos`
  - Body: `codigo`, `nom_producto`, `desc_producto`, `pre_publico`, `pre_proveedor`, `existencias`
- `PUT /productos/:codigo`
  - Body: `nom_producto`, `desc_producto`, `pre_publico`, `pre_proveedor`, `existencias`
- `DELETE /productos/:producto`

### Ventas (protegidas)
- `GET /ventas?inicio=YYYY-MM-DD&fin=YYYY-MM-DD`
- `POST /ventas`
  - Body recomendado:
    - `productos` (string)
    - `total_venta` (number)
    - `vendedor` (string)
  - Compatibilidad legacy:
    - `venta`: string con formato `productos_total_vendedor`

### Equipos (protegidas)
- `GET /estados_equipo`
- `GET /equipos`
- `POST /equipos/asignacion`
  - Body: `num_serie`, `usuario?`
- `POST /equipos/reporte/add`
  - Body: `num_serie`, `falla`
- `GET /equipos/mantenimientos`
- `POST /equipos/mantenimientos/update`
  - Body: `num_serie`, `id_historial`, `tecnico`, `solucion`
- `POST /equipos/mantenimientos/find`
  - Body: `filter`

## Manejo de errores
- Respuestas JSON con estructura:
  - `success: false`
  - `message: <detalle>` (en producción se oculta el detalle)

## Notas
- Ejecuta el esquema desde `db_inv_ti.sql`.
- La columna `usuarios.contrasena` debe permitir hashes (varchar 255).
- La columna `usuarios.rol` se usa para autorización.
- La columna `usuarios.token_version` se usa para revocar tokens.
