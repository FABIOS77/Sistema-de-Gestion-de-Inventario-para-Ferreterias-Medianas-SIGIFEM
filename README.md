# SIGIFEM — Sistema de Gestión de Inventario para Ferreterías Medianas

Sistema web de gestión de inventario, compras, ventas y módulo financiero desarrollado para **Novatech**.

---

## ✅ Requisitos previos

Antes de ejecutar el proyecto asegúrate de tener instalado:

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18+ | https://nodejs.org |
| [MySQL](https://dev.mysql.com/downloads/) | 8.0+ | https://dev.mysql.com/downloads |

---

## 🚀 Pasos para ejecutar

### 1. Clonar o descargar el proyecto

```bash
git clone <url-del-repositorio>
cd Novatech
```

> Si ya tienes la carpeta descargada, simplemente navega hasta ella.

---

### 2. Instalar las dependencias

```bash
npm install
```

---

### 3. Crear la base de datos

Abre **MySQL Workbench** o la terminal de MySQL y ejecuta el archivo `database.sql`:

**Opción A — Desde la terminal de MySQL:**

```bash
mysql -u root -p < database.sql
```

**Opción B — Desde MySQL Workbench:**

1. Abre MySQL Workbench y conéctate a tu servidor local.
2. Ve a `File > Open SQL Script` y selecciona el archivo `database.sql`.
3. Ejecuta el script completo con `Ctrl + Shift + Enter`.

Esto creará la base de datos `tornillo_feliz` con todas las tablas y datos de prueba incluidos.

---

### 4. Configurar la conexión a la base de datos *(opcional)*

Por defecto el servidor se conecta con:

| Parámetro | Valor por defecto |
|---|---|
| Host | `127.0.0.1` |
| Puerto | `3306` |
| Usuario | `root` |
| Contraseña | `root` |
| Base de datos | `tornillo_feliz` |

Si tu configuración de MySQL es diferente, puedes sobreescribir los valores usando variables de entorno antes de iniciar el servidor:

```bash
# Windows (PowerShell)
$env:DB_USER="tu_usuario"; $env:DB_PASSWORD="tu_contraseña"; npm start

# Windows (CMD)
set DB_USER=tu_usuario && set DB_PASSWORD=tu_contraseña && npm start
```

---

### 5. Iniciar el servidor

```bash
npm start
```

Verás en consola:

```
Servidor corriendo en http://localhost:5173
```

---

### 6. Abrir la aplicación

Abre tu navegador y ve a:

```
http://localhost:5173
```

---

## 🔑 Credenciales de acceso por defecto

| Campo | Valor |
|---|---|
| Usuario | `admin` |
| Contraseña | `admin` |

---

## 📁 Estructura del proyecto

```
Novatech/
├── server.js       # Servidor HTTP y API REST (Node.js)
├── app.js          # Lógica del frontend
├── index.html      # Interfaz principal
├── styles.css      # Estilos
├── database.sql    # Script de creación de base de datos
└── package.json    # Dependencias del proyecto
```
