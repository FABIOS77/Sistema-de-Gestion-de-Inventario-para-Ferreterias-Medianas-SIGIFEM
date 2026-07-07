const app = document.querySelector("#app");
const pageTitle = document.querySelector("#pageTitle");
const navLinks = [...document.querySelectorAll(".nav a")];
const sidebar = document.querySelector(".sidebar");
const menuToggle = document.querySelector("#menuToggle");
const userPill = document.querySelector("#userPill");

let auth = JSON.parse(localStorage.getItem("tf_auth") || "null");
let financeState = { accounts: [], journal: [], ledger: [], balance: null, balances: [] };
let usersState = { users: [] };
let finDateFrom = "";
let finDateTo = "";
let entryLines = [];
let userEditId = null;

const money = new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", maximumFractionDigits: 2 });

const stock = [
  ["TH-001","Taladro percutor 850W","Lote TAL-2406","Central",18,8,"Disponible"],
  ["TO-114","Tornillo drywall 1 1/2","Lote DRY-1906","Quillacollo",3200,1200,"Disponible"],
  ["CE-077","Cemento cola premium","Lote CEM-1606","Sacaba",22,35,"Stock bajo"],
  ["CA-042","Cable THHN #12 rojo","Lote CAB-2106","Central",90,60,"Disponible"],
  ["GU-009","Guante nitrilo industrial","Lote SEG-1106","Quillacollo",14,30,"Stock bajo"],
];
const movements = [
  ["08:45","Ingreso por compra OC-2026-184","Cemento cola premium","+80 unidades"],
  ["10:12","Venta mostrador V-009421","Taladro percutor 850W","-2 unidades"],
  ["11:30","Transferencia a Sacaba","Cable THHN #12 rojo","-40 unidades"],
  ["13:05","Ajuste autorizado","Guante nitrilo industrial","-6 unidades"],
];
const suppliers = [
  ["FerroMax SRL","Herramientas electricas","compras@ferromax.bo","Activo"],
  ["Distribuidora Andina","Material de obra","ventas@andina.bo","Activo"],
  ["SegurPro","EPP y seguridad","contacto@segurpro.bo","Revision"],
];
const purchases = [
  ["OC-2026-184","Distribuidora Andina","Cemento y adhesivos","Bs 18.420","Recibido"],
  ["OC-2026-185","FerroMax SRL","Taladros y discos","Bs 24.780","En transito"],
  ["OC-2026-186","SegurPro","Guantes y lentes","Bs 6.960","Pendiente"],
];
const sales = [
  ["V-009421","Mostrador Central","Taladro percutor 850W","2","Stock descontado"],
  ["V-009422","Cliente Constructora Alba","Cable THHN #12 rojo","35","Stock descontado"],
  ["V-009423","Mostrador Sacaba","Cemento cola premium","4","Reservado"],
];
const moduleAccess = [
  ["Inventario y Bodega",true,"Entradas, salidas, Kardex y lotes"],
  ["Administracion y Compras",true,"Proveedores, ordenes y precios"],
  ["Ventas",true,"Consulta de disponibilidad y salida automatica"],
  ["Finanzas y Contabilidad",true,"Libro diario, mayor y balances"],
  ["Usuarios y Permisos",true,"Solo superusuario"],
];

let invTab = "stock";
let compTab = "proveedores";
let ventTab = "nueva";
let usrTab = "lista";
let financeTab = "asiento";

function getAllowedModules() {
  if (!auth?.user) return [];
  const { role, modules } = auth.user;
  if (role === "superusuario") return ["dashboard","inventario","compras","ventas","finanzas","usuarios"];
  if (role === "administrador") return ["dashboard","inventario","compras","ventas","finanzas"];
  return Array.isArray(modules) ? modules : ["dashboard"];
}

const views = {
  dashboard: {
    title: "Panel general",
    render: () => `
      <div class="dash-kpis">
        <div class="dash-kpi">
          <div class="dash-kpi-icon" style="background:#e8f5ef;color:var(--brand)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          </div>
          <div><span class="dash-kpi-label">Productos activos</span><strong class="dash-kpi-val">1.284</strong><small>74 familias ferreteras</small></div>
        </div>
        <div class="dash-kpi">
          <div class="dash-kpi-icon" style="background:#eaf1f8;color:var(--brand-2)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <div><span class="dash-kpi-label">Ordenes de compra</span><strong class="dash-kpi-val">12</strong><small>3 en seguimiento</small></div>
        </div>
        <div class="dash-kpi">
          <div class="dash-kpi-icon" style="background:#fff5e5;color:var(--warn)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div><span class="dash-kpi-label">Ventas del mes</span><strong class="dash-kpi-val">Bs 142K</strong><small>+18% vs mes anterior</small></div>
        </div>
        <div class="dash-kpi">
          <div class="dash-kpi-icon" style="background:#e8f5ef;color:var(--ok)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div><span class="dash-kpi-label">Utilidad neta</span><strong class="dash-kpi-val">Bs 28.4K</strong><small>Periodo acumulado</small></div>
        </div>
        <div class="dash-kpi">
          <div class="dash-kpi-icon" style="background:#fdecec;color:var(--danger)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div><span class="dash-kpi-label">Alertas criticas</span><strong class="dash-kpi-val">11</strong><small>Stock bajo en 3 sucursales</small></div>
        </div>
      </div>
      <div class="dash-body">
        <div class="dash-main">
          <div class="panel"><h2>Actividad reciente</h2><div class="stack">${movements.map(r => movementRow(r)).join("")}</div></div>
          <div class="panel"><h2>Ultimas ventas</h2>${simpleTable(["Venta","Origen","Producto","Cant.","Estado"],sales)}</div>
        </div>
        <div class="dash-side">
          <div class="panel"><h2>Sucursales</h2><div class="branch-list">
            ${[["Central &mdash; Santa Cruz","ok","892 productos","Bs 74K ventas"],["Quillacollo","ok","241 productos","Bs 38K ventas"],["Sacaba","warn","151 productos","2 alertas stock"]].map(([name,status,s1,s2]) => `
              <div class="branch-item"><span class="branch-status ${status}"></span><div><strong>${name}</strong><small>${s1} &bull; ${s2}</small></div></div>
            `).join("")}
          </div></div>
          <div class="panel"><h2>Modulos del sistema</h2><div class="mod-list">
            ${["Inventario y Bodega","Compras","Ventas","Contabilidad","Usuarios"].map(n => `
              <div class="mod-item"><span>${n}</span><span class="status ok">Activo</span></div>
            `).join("")}
          </div></div>
        </div>
      </div>
    `,
  },
  inventario: {
    title: "Inventario y Bodega",
    render: () => `
      <div class="mod-kpis">
        ${modKpi("1.284","Productos activos","74 familias")}${modKpi("318","Lotes abiertos","Trazabilidad por sucursal")}
        ${modKpi("11","Alertas criticas","Stock bajo")}${modKpi("146","Movimientos hoy","Kardex del dia")}
      </div>
      <div class="mod-tabs">
        <button class="mod-tab-btn ${invTab==="stock"?"active":""}" data-tab="stock" data-mod="inv">Stock</button>
        <button class="mod-tab-btn ${invTab==="alertas"?"active":""}" data-tab="alertas" data-mod="inv">Alertas</button>
        <button class="mod-tab-btn ${invTab==="movimiento"?"active":""}" data-tab="movimiento" data-mod="inv">Nuevo movimiento</button>
        <button class="mod-tab-btn ${invTab==="kardex"?"active":""}" data-tab="kardex" data-mod="inv">Kardex</button>
      </div>
      <div id="invTabBody"></div>
    `,
    afterRender: () => { bindModTabs("inv",(t)=>{invTab=t;renderInvTab();}); renderInvTab(); },
  },
  compras: {
    title: "Administrativa y Compras",
    render: () => `
      <div class="mod-kpis">
        ${modKpi("3","Proveedores activos","Homologados")}${modKpi("OC-186","Ultima orden","SegurPro")}
        ${modKpi("Bs 50.2K","Compras del mes","3 ordenes")}${modKpi("32%","Margen promedio","Sobre costo")}
      </div>
      <div class="mod-tabs">
        <button class="mod-tab-btn ${compTab==="proveedores"?"active":""}" data-tab="proveedores" data-mod="comp">Proveedores</button>
        <button class="mod-tab-btn ${compTab==="ordenes"?"active":""}" data-tab="ordenes" data-mod="comp">Ordenes de compra</button>
        <button class="mod-tab-btn ${compTab==="nueva"?"active":""}" data-tab="nueva" data-mod="comp">Nueva orden</button>
        <button class="mod-tab-btn ${compTab==="precios"?"active":""}" data-tab="precios" data-mod="comp">Politicas de precio</button>
      </div>
      <div id="compTabBody"></div>
    `,
    afterRender: () => { bindModTabs("comp",(t)=>{compTab=t;renderCompTab();}); renderCompTab(); },
  },
  ventas: {
    title: "Ventas",
    render: () => `
      <div class="mod-kpis">
        ${modKpi("Bs 142K","Ventas del mes","+18% vs anterior")}${modKpi("3","Ventas hoy","V-009421 al V-009423")}
        ${modKpi("Bs 47.4K","Ticket promedio","Por operacion")}${modKpi("95%","Disponibilidad","Stock cubierto")}
      </div>
      <div class="mod-tabs">
        <button class="mod-tab-btn ${ventTab==="nueva"?"active":""}" data-tab="nueva" data-mod="vent">Nueva venta</button>
        <button class="mod-tab-btn ${ventTab==="historial"?"active":""}" data-tab="historial" data-mod="vent">Historial</button>
        <button class="mod-tab-btn ${ventTab==="stock"?"active":""}" data-tab="stock" data-mod="vent">Consulta de stock</button>
      </div>
      <div id="ventTabBody"></div>
    `,
    afterRender: () => { bindModTabs("vent",(t)=>{ventTab=t;renderVentTab();}); renderVentTab(); },
  },
  finanzas: { title: "Contabilidad", render: financeView, afterRender: loadFinance },
  usuarios: { title: "Usuarios y Permisos", render: usersView, afterRender: loadUsers },
};

function api(path, options = {}) {
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(auth?.token ? { Authorization: "Bearer " + auth.token } : {}),
      ...(options.headers || {}),
    },
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.message || "Error de servidor");
    return data;
  });
}

function renderLogin(message = "") {
  document.body.classList.add("login-mode");
  app.innerHTML = `
    <section class="login-screen">
      <form class="login-card" id="loginForm">
        <div class="brand-mark">TF</div>
        <p class="eyebrow">Acceso al sistema</p>
        <h1>Tornillo Feliz</h1>
        <p>Ingresa tus credenciales para continuar.</p>
        ${message ? `<div class="notice danger">${message}</div>` : ""}
        <label class="field"><span>Usuario</span><input name="username" value="admin" autocomplete="username" /></label>
        <label class="field"><span>Contrasena</span><input name="password" type="password" value="admin" autocomplete="current-password" /></label>
        <button class="primary-btn" type="submit">Entrar</button>
      </form>
    </section>
  `;
  pageTitle.textContent = "Login";
  document.querySelector("#loginForm").addEventListener("submit", handleLogin);
}

async function handleLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    auth = await api("/api/login", { method: "POST", body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) });
    localStorage.setItem("tf_auth", JSON.stringify(auth));
    document.body.classList.remove("login-mode");
    location.hash = "#/dashboard";
    render();
  } catch (error) { renderLogin(error.message); }
}

async function logout() {
  try { await api("/api/logout", { method: "POST" }); } catch (e) { console.warn(e); }
  auth = null;
  localStorage.removeItem("tf_auth");
  renderLogin();
}

function modKpi(value, label, sub) {
  return `<div class="mod-kpi"><strong>${value}</strong><span>${label}</span><small>${sub}</small></div>`;
}

function bindModTabs(mod, onChange) {
  document.querySelectorAll(`.mod-tab-btn[data-mod="${mod}"]`).forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(`.mod-tab-btn[data-mod="${mod}"]`).forEach(b => b.classList.toggle("active", b === btn));
      onChange(btn.dataset.tab);
    });
  });
}

function renderInvTab() {
  const body = document.querySelector("#invTabBody");
  if (!body) return;
  if (invTab === "stock") {
    body.innerHTML = `<div class="panel"><div class="toolbar" style="margin-bottom:14px">
      <select><option>Central - Santa Cruz</option><option>Quillacollo</option><option>Sacaba</option></select>
      <select><option>Todas las familias</option><option>Herramientas</option><option>Material de obra</option></select>
      <button class="small-btn">Filtrar</button></div>${stockTable()}</div>`;
  } else if (invTab === "alertas") {
    body.innerHTML = `<div class="panel"><h2>Alertas de stock bajo</h2><div class="stack">
      ${alertRow("Cemento cola premium","Sacaba tiene 22 unidades. Minimo: 35.","Crear compra")}
      ${alertRow("Guante nitrilo industrial","Quillacollo tiene 14 unidades. Minimo: 30.","Crear compra")}
      ${alertRow("Disco diamantado 7 pulg.","Central proyecta quiebre en 3 dias.","Notificar")}
    </div></div>`;
  } else if (invTab === "movimiento") {
    body.innerHTML = `<div class="panel"><h2>Registrar movimiento</h2><div class="form-grid">
      ${field("Producto","select",["Taladro percutor 850W","Cemento cola premium","Cable THHN #12 rojo"])}
      ${field("Lote","text","LOT-2026-000")}
      ${field("Sucursal","select",["Central","Quillacollo","Sacaba"])}
      ${field("Tipo","select",["Entrada","Salida","Transferencia","Ajuste"])}
      ${field("Cantidad","number","0")}${field("Responsable","text","Maria Choque")}
    </div><div class="toolbar" style="margin-top:14px"><button class="primary-btn">Registrar</button></div></div>`;
  } else if (invTab === "kardex") {
    body.innerHTML = `<div class="panel"><h2>Kardex de movimientos</h2><div class="stack">${movements.map(r => movementRow(r)).join("")}</div></div>`;
  }
}

function renderCompTab() {
  const body = document.querySelector("#compTabBody");
  if (!body) return;
  if (compTab === "proveedores") {
    body.innerHTML = `<div class="panel"><h2>Proveedores registrados</h2>${simpleTable(["Proveedor","Rubro","Contacto","Estado"],suppliers)}</div>`;
  } else if (compTab === "ordenes") {
    body.innerHTML = `<div class="panel"><h2>Ordenes de compra</h2>${simpleTable(["OC","Proveedor","Detalle","Total","Estado"],purchases)}</div>`;
  } else if (compTab === "nueva") {
    body.innerHTML = `<div class="panel"><h2>Nueva orden de compra</h2><div class="form-grid">
      ${field("Proveedor","select",["FerroMax SRL","Distribuidora Andina","SegurPro"])}
      ${field("Fecha estimada","text","05/07/2026")}${field("Producto","text","Cemento cola premium")}
      ${field("Cantidad","number","80")}${field("Costo unitario","text","Bs 95")}
      ${field("Sucursal destino","select",["Central","Quillacollo","Sacaba"])}
    </div><div class="toolbar" style="margin-top:14px"><button class="primary-btn">Generar OC</button></div></div>`;
  } else if (compTab === "precios") {
    body.innerHTML = `<div class="panel"><h2>Margenes por categoria</h2><p class="fin-hint">Porcentaje de margen sobre costo de compra aplicado en ventas.</p><div class="bars">
      ${bar("Herramientas",32,"32%")}${bar("Material obra",24,"24%")}${bar("Electricidad",28,"28%")}${bar("Seguridad",35,"35%")}
    </div></div>`;
  }
}

function renderVentTab() {
  const body = document.querySelector("#ventTabBody");
  if (!body) return;
  if (ventTab === "nueva") {
    body.innerHTML = `<div class="panel"><h2>Registrar venta</h2><div class="form-grid">
      ${field("Cliente","text","Mostrador")}${field("Sucursal","select",["Central","Quillacollo","Sacaba"])}
      ${field("Producto","select",["Taladro percutor 850W","Cable THHN #12 rojo","Cemento cola premium"])}
      ${field("Cantidad","number","2")}${field("Lista de precio","select",["Publico","Constructor","Mayorista"])}
      ${field("Observacion","text","")}
    </div><div class="toolbar" style="margin-top:14px"><button class="primary-btn">Registrar venta</button></div></div>`;
  } else if (ventTab === "historial") {
    body.innerHTML = `<div class="panel"><h2>Historial de ventas</h2>${simpleTable(["Venta","Origen","Producto","Cant.","Estado"],sales)}</div>`;
  } else if (ventTab === "stock") {
    body.innerHTML = `<div class="panel"><h2>Consulta de disponibilidad</h2><div class="toolbar" style="margin-bottom:14px">
      <select><option>Todas las sucursales</option><option>Central</option><option>Quillacollo</option><option>Sacaba</option></select>
      <button class="small-btn">Buscar</button></div>${stockTable()}</div>`;
  }
}

// ── USERS MODULE ─────────────────────────────────────────
function usersView() {
  const isSu = auth?.user?.role === "superusuario";
  return `
    <div class="mod-tabs">
      <button class="mod-tab-btn ${usrTab==="lista"?"active":""}" data-tab="lista" data-mod="usr">Usuarios</button>
      ${isSu ? `<button class="mod-tab-btn ${usrTab==="nuevo"?"active":""}" data-tab="nuevo" data-mod="usr">Nuevo usuario</button>` : ""}
      <button class="mod-tab-btn ${usrTab==="roles"?"active":""}" data-tab="roles" data-mod="usr">Roles y accesos</button>
    </div>
    <div id="usrTabBody"></div>
  `;
}

async function loadUsers() {
  if (auth?.user?.role === "superusuario") {
    try {
      const data = await api("/api/users");
      usersState.users = data.users;
    } catch (e) { usersState.users = []; }
  }
  bindModTabs("usr", (t) => { usrTab = t; if (t !== "nuevo") userEditId = null; renderUsrTab(); });
  renderUsrTab();
}

function renderUsrTab() {
  const body = document.querySelector("#usrTabBody");
  if (!body) return;
  const isSu = auth?.user?.role === "superusuario";

  if (usrTab === "lista") {
    body.innerHTML = `
      <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h2 style="margin:0">Usuarios del sistema</h2>
          ${isSu ? `<button class="primary-btn" id="btnNewUser" style="font-size:13px;padding:7px 14px">+ Nuevo usuario</button>` : ""}
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Nombre</th><th>Usuario</th><th>Contrasena</th><th>Rol</th><th>Modulos</th><th>Estado</th>
              ${isSu ? "<th>Acciones</th>" : ""}
            </tr></thead>
            <tbody>
              ${usersState.users.map(u => `
                <tr>
                  <td>${u.full_name}</td>
                  <td><code>${u.username}</code></td>
                  <td><code>${u.password}</code></td>
                  <td><span class="status ${u.role==="superusuario"?"danger":"ok"}">${roleLabel(u.role)}</span></td>
                  <td style="font-size:12px;color:var(--muted)">
                    ${u.role==="superusuario"?"Todos":u.role==="administrador"?"Todos (sin usuarios)":(u.modules||[]).join(", ")}
                  </td>
                  <td><span class="status ${u.is_active?"ok":"warn"}">${u.is_active?"Activo":"Inactivo"}</span></td>
                  ${isSu ? `<td>${u.role!=="superusuario"?`<div style="display:flex;gap:4px">
                    <button class="small-btn edit-user" data-id="${u.id}">Editar</button>
                    <button class="small-btn del-user" data-id="${u.id}" style="color:var(--danger)">Eliminar</button>
                  </div>`:"—"}</td>` : ""}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
    document.querySelector("#btnNewUser")?.addEventListener("click", () => {
      userEditId = null; usrTab = "nuevo";
      document.querySelectorAll(".mod-tab-btn[data-mod='usr']").forEach(b => b.classList.toggle("active", b.dataset.tab==="nuevo"));
      renderUsrTab();
    });
    document.querySelectorAll(".edit-user").forEach(btn => {
      btn.addEventListener("click", () => {
        userEditId = Number(btn.dataset.id); usrTab = "nuevo";
        document.querySelectorAll(".mod-tab-btn[data-mod='usr']").forEach(b => b.classList.toggle("active", b.dataset.tab==="nuevo"));
        renderUsrTab();
      });
    });
    document.querySelectorAll(".del-user").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Eliminar este usuario?")) return;
        try {
          await api("/api/users/" + btn.dataset.id, { method: "DELETE" });
          const d = await api("/api/users"); usersState.users = d.users; renderUsrTab();
        } catch (e) { alert(e.message); }
      });
    });

  } else if (usrTab === "nuevo") {
    const editing = userEditId ? usersState.users.find(u => u.id === userEditId) : null;
    const modLabels = { dashboard:"Panel general", inventario:"Inventario y Bodega", compras:"Compras", ventas:"Ventas", finanzas:"Contabilidad" };
    const modKeys = ["dashboard","inventario","compras","ventas","finanzas"];
    const isUsuario = editing ? editing.role === "usuario" : false;
    body.innerHTML = `
      <div class="panel" style="max-width:720px">
        <h2>${editing ? "Editar usuario: " + editing.full_name : "Nuevo usuario"}</h2>
        <form id="userForm" class="form-grid">
          <label class="field"><span>Nombre completo</span>
            <input name="full_name" value="${editing ? editing.full_name : ""}" required /></label>
          <label class="field"><span>Usuario (login)</span>
            <input name="username" value="${editing ? editing.username : ""}" required /></label>
          <label class="field"><span>Contrasena</span>
            <input name="password" type="text" value="${editing ? editing.password : ""}" required /></label>
          <label class="field"><span>Rol</span>
            <select name="role" id="roleSelect">
              <option value="administrador" ${!editing||editing.role==="administrador"?"selected":""}>Administrador</option>
              <option value="usuario" ${editing?.role==="usuario"?"selected":""}>Usuario</option>
            </select></label>
          <label class="field"><span>Estado</span>
            <select name="is_active">
              <option value="1" ${!editing||editing.is_active?"selected":""}>Activo</option>
              <option value="0" ${editing&&!editing.is_active?"selected":""}>Inactivo</option>
            </select></label>
          <div class="span-2" id="modulesSection" style="display:${isUsuario?"block":"none"}">
            <p style="margin:0 0 10px;font-weight:600;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">Modulos permitidos</p>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
              ${modKeys.map(m => `
                <label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;padding:8px 10px;border:1px solid var(--line);border-radius:6px">
                  <input type="checkbox" name="modules" value="${m}"
                    ${m==="dashboard"?"disabled checked":""}
                    ${editing?.modules?.includes(m)?"checked":""}
                    style="width:16px;height:16px" />
                  ${modLabels[m]}
                </label>
              `).join("")}
            </div>
          </div>
          <div class="span-2 toolbar">
            <button class="primary-btn" type="submit" id="userSubmit">${editing?"Actualizar usuario":"Crear usuario"}</button>
            <button class="ghost-btn" type="button" id="cancelUserEdit">Cancelar</button>
            <span id="userMessage" class="form-message"></span>
          </div>
        </form>
      </div>
    `;
    document.querySelector("#roleSelect").addEventListener("change", (e) => {
      document.querySelector("#modulesSection").style.display = e.target.value === "usuario" ? "block" : "none";
    });
    document.querySelector("#cancelUserEdit").addEventListener("click", () => {
      userEditId = null; usrTab = "lista";
      document.querySelectorAll(".mod-tab-btn[data-mod='usr']").forEach(b => b.classList.toggle("active", b.dataset.tab==="lista"));
      renderUsrTab();
    });
    document.querySelector("#userForm").addEventListener("submit", saveUser);

  } else if (usrTab === "roles") {
    body.innerHTML = `
      <div class="grid three">
        ${moduleCard("Superusuario","Acceso total al sistema. Gestiona usuarios y todos los modulos. Es unico e intransferible.",["Total","Unico"])}
        ${moduleCard("Administrador","Acceso a todos los modulos operativos. No puede crear ni gestionar otros usuarios.",["Sin usuarios"])}
        ${moduleCard("Usuario","Acceso limitado solo a los modulos que el administrador le asigne individualmente.",["Por modulo"])}
      </div>
    `;
  }
}

async function saveUser(event) {
  event.preventDefault();
  const msg = document.querySelector("#userMessage");
  const btn = document.querySelector("#userSubmit");
  const form = event.currentTarget;
  const data = new FormData(form);
  const selectedModules = ["dashboard", ...Array.from(form.querySelectorAll("input[name='modules']:checked:not(:disabled)")).map(c => c.value)];
  const body = {
    full_name: data.get("full_name"),
    username: data.get("username"),
    password: data.get("password"),
    role: data.get("role"),
    is_active: data.get("is_active") !== "0",
    modules: selectedModules,
  };
  btn.disabled = true; btn.textContent = "Guardando...";
  try {
    if (userEditId) {
      await api("/api/users/" + userEditId, { method: "PUT", body: JSON.stringify(body) });
    } else {
      await api("/api/users", { method: "POST", body: JSON.stringify(body) });
    }
    msg.textContent = userEditId ? "Usuario actualizado." : "Usuario creado.";
    msg.style.color = "var(--ok)";
    userEditId = null;
    const resp = await api("/api/users");
    usersState.users = resp.users;
    setTimeout(() => {
      usrTab = "lista";
      document.querySelectorAll(".mod-tab-btn[data-mod='usr']").forEach(b => b.classList.toggle("active", b.dataset.tab==="lista"));
      renderUsrTab();
    }, 800);
  } catch (e) {
    msg.textContent = e.message; msg.style.color = "var(--danger)";
    btn.disabled = false; btn.textContent = userEditId ? "Actualizar usuario" : "Crear usuario";
  }
}

function roleLabel(role) {
  return { superusuario:"Superusuario", administrador:"Administrador", usuario:"Usuario" }[role] || role;
}

// ── FINANCE MODULE ────────────────────────────────────────
function financeView() {
  return `<section id="financeRoot"><div class="notice">Cargando datos financieros...</div></section>`;
}

async function loadFinance() {
  const root = document.querySelector("#financeRoot");
  try {
    const params = new URLSearchParams();
    if (finDateFrom) params.set("from", finDateFrom);
    if (finDateTo)   params.set("to",   finDateTo);
    const qs = params.toString() ? "?" + params.toString() : "";
    financeState = await api("/api/finance" + qs);
    root.innerHTML = financeShell();
    bindFinanceTabs();
    renderFinanceTab();
  } catch (e) {
    root.innerHTML = `<div class="notice danger">${e.message}</div>`;
  }
}

async function reloadFinance() {
  const root = document.querySelector("#financeRoot");
  if (!root) return;
  root.innerHTML = `<div class="notice">Cargando...</div>`;
  await loadFinance();
}

function financeShell() {
  const t = financeState.balance.totals;
  const balanced = Math.abs(t.assets - t.liabilitiesAndEquity) < 0.01;
  return `
    <div class="fin-kpis">
      ${finKpi("Activos totales", money.format(t.assets), "asset")}
      ${finKpi("Pasivos", money.format(t.liabilities), "liability")}
      ${finKpi("Patrimonio", money.format(t.equity), "equity")}
      ${finKpi("Utilidad neta", money.format(t.netIncome), t.netIncome >= 0 ? "income" : "expense")}
      <div class="fin-kpi fin-kpi--status">
        <span class="fk-label">Balance</span>
        <span class="status ${balanced?"ok":"danger"}">${balanced?"Cuadrado \u2713":"Descuadrado !"}</span>
      </div>
    </div>
    <div class="fin-tabs">
      <button class="fin-tab-btn ${financeTab==="asiento"?"active":""}" data-tab="asiento">Nuevo asiento</button>
      <button class="fin-tab-btn ${financeTab==="cuentas"?"active":""}" data-tab="cuentas">Plan de Cuentas</button>
      <button class="fin-tab-btn ${financeTab==="diario"?"active":""}" data-tab="diario">Libro Diario</button>
      <button class="fin-tab-btn ${financeTab==="mayor"?"active":""}" data-tab="mayor">Libro Mayor</button>
      <button class="fin-tab-btn ${financeTab==="balance"?"active":""}" data-tab="balance">Balance General</button>
      <button class="fin-tab-btn ${financeTab==="resultados"?"active":""}" data-tab="resultados">Estado de Resultados</button>
    </div>
    <div id="finTabBody"></div>
  `;
}

function finKpi(label, value, type) {
  const colors = { asset:"--brand", liability:"--danger", equity:"--brand-2", income:"--ok", expense:"--warn" };
  return `<div class="fin-kpi" style="--fk-color:var(${colors[type]||"--brand"})">
    <span class="fk-label">${label}</span><strong class="fk-value">${value}</strong>
  </div>`;
}

function bindFinanceTabs() {
  document.querySelectorAll(".fin-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      financeTab = btn.dataset.tab;
      document.querySelectorAll(".fin-tab-btn").forEach(b => b.classList.toggle("active", b === btn));
      renderFinanceTab();
    });
  });
}

function renderFinanceTab() {
  const body = document.querySelector("#finTabBody");
  if (!body) return;
  const map = { asiento: tabAsiento, cuentas: tabCuentas, diario: tabDiario, mayor: tabMayor, balance: tabBalance, resultados: tabResultados };
  body.innerHTML = (map[financeTab] || tabAsiento)();

  if (financeTab === "asiento") {
    bindEntryLineEvents();
    document.querySelector("#addLineBtn")?.addEventListener("click", () => {
      entryLines.push({ accountId: "", debit: "", credit: "" });
      refreshEntryLines();
    });
    document.querySelector("#entryForm")?.addEventListener("submit", saveEntry);
  } else if (financeTab === "cuentas") {
    document.querySelector("#accountForm")?.addEventListener("submit", saveAccount);
    document.querySelectorAll(".del-acc").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("Eliminar esta cuenta?")) return;
        try {
          await api("/api/finance/accounts/" + btn.dataset.id, { method: "DELETE" });
          await reloadFinance();
        } catch (e) { alert(e.message); }
      });
    });
    document.querySelectorAll(".edit-acc").forEach(btn => {
      btn.addEventListener("click", () => {
        const form = document.querySelector("#accountForm");
        form.elements.code.value = btn.dataset.code;
        form.elements.name.value = btn.dataset.name;
        form.elements.type.value = btn.dataset.type;
        form.dataset.editId = btn.dataset.id;
        document.querySelector("#accountSubmit").textContent = "Actualizar cuenta";
      });
    });
  } else if (["diario","mayor","balance","resultados"].includes(financeTab)) {
    document.querySelector("#applyFilter")?.addEventListener("click", () => {
      finDateFrom = document.querySelector("#filterFrom")?.value || "";
      finDateTo   = document.querySelector("#filterTo")?.value   || "";
      reloadFinance();
    });
    document.querySelector("#clearFilter")?.addEventListener("click", () => {
      finDateFrom = ""; finDateTo = ""; reloadFinance();
    });
  }
}

function dateFilterBar() {
  return `
    <div class="toolbar" style="margin-bottom:16px;flex-wrap:wrap;align-items:flex-end;gap:8px">
      <label class="field" style="margin:0;flex-direction:row;align-items:center;gap:6px">
        <span style="white-space:nowrap">Desde</span>
        <input type="date" id="filterFrom" value="${finDateFrom}" style="min-height:34px;font-size:13px" />
      </label>
      <label class="field" style="margin:0;flex-direction:row;align-items:center;gap:6px">
        <span style="white-space:nowrap">Hasta</span>
        <input type="date" id="filterTo" value="${finDateTo}" style="min-height:34px;font-size:13px" />
      </label>
      <button class="small-btn" id="applyFilter">Aplicar</button>
      ${finDateFrom||finDateTo ? `<button class="ghost-btn" id="clearFilter">Limpiar filtro</button>` : ""}
      ${finDateFrom||finDateTo ? `<span class="status warn" style="font-size:12px">Filtrando: ${finDateFrom||"inicio"} al ${finDateTo||"hoy"}</span>` : ""}
    </div>
  `;
}

function initEntryLines() {
  if (entryLines.length === 0) {
    entryLines = [
      { accountId: "", debit: "", credit: "" },
      { accountId: "", debit: "", credit: "" },
    ];
  }
}

function renderEntryLinesHTML() {
  return entryLines.map((line, i) => {
    const bal = financeState.balances.find(b => b.id == line.accountId);
    const credit = Number(line.credit || 0);
    const warn = bal && bal.type === "asset" && credit > 0 && credit > bal.balance;
    return `
      <div class="entry-line${warn?" entry-line-warn":""}">
        <select class="entry-account" data-index="${i}">
          <option value="">-- Selecciona cuenta --</option>
          ${financeState.accounts.map(a =>
            `<option value="${a.id}" ${line.accountId==a.id?"selected":""}>${a.code} \u2014 ${a.name} (${typeLabel(a.type)})</option>`
          ).join("")}
        </select>
        <input type="number" class="entry-debit" data-index="${i}" value="${line.debit||""}" min="0" step="0.01" placeholder="0.00" />
        <input type="number" class="entry-credit" data-index="${i}" value="${line.credit||""}" min="0" step="0.01" placeholder="0.00" />
        <button type="button" class="entry-remove" data-index="${i}" ${entryLines.length<=2?"disabled":""}>&#x2715;</button>
      </div>
      ${warn ? `<div class="entry-line-warning">&#9888; Saldo insuficiente en "${bal.name}". Disponible: ${money.format(bal.balance)}</div>` : ""}
    `;
  }).join("");
}

function refreshEntryLines() {
  const linesBody = document.querySelector("#entryLinesBody");
  if (linesBody) linesBody.innerHTML = renderEntryLinesHTML();
  bindEntryLineEvents();
  refreshEntryTotals();
}

function refreshEntryTotals() {
  const totalDebit  = entryLines.reduce((s, l) => s + Number(l.debit  || 0), 0);
  const totalCredit = entryLines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
  const hasWarn = entryLines.some(line => {
    const bal = financeState.balances.find(b => b.id == line.accountId);
    const credit = Number(line.credit || 0);
    return bal && bal.type === "asset" && credit > 0 && credit > bal.balance;
  });
  const totals = document.querySelector("#entryTotals");
  if (totals) {
    totals.innerHTML = `
      <span>Total Debe: <strong style="color:var(--ok)">${money.format(totalDebit)}</strong></span>
      <span style="margin:0 12px">Total Haber: <strong style="color:var(--danger)">${money.format(totalCredit)}</strong></span>
      <span class="status ${balanced&&!hasWarn?"ok":"danger"}">
        ${hasWarn ? "&#9888; Saldo insuficiente en alguna cuenta" : balanced ? "\u2713 Balanceado" : totalDebit===0 ? "Ingresa montos" : "\u2717 Diferencia: " + money.format(Math.abs(totalDebit - totalCredit))}
      </span>
    `;
  }
  // Removed dynamic disable so custom validation works on click
}

function bindEntryLineEvents() {
  document.querySelectorAll(".entry-account").forEach(sel => {
    sel.addEventListener("change", (e) => {
      entryLines[Number(e.target.dataset.index)].accountId = e.target.value;
      refreshEntryLines();
    });
  });
  document.querySelectorAll(".entry-debit").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const i = Number(e.target.dataset.index);
      entryLines[i].debit = e.target.value;
      if (Number(e.target.value) > 0) { entryLines[i].credit = ""; const ci = document.querySelector(`.entry-credit[data-index="${i}"]`); if(ci) ci.value=""; }
      refreshEntryTotals();
    });
  });
  document.querySelectorAll(".entry-credit").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const i = Number(e.target.dataset.index);
      entryLines[i].credit = e.target.value;
      if (Number(e.target.value) > 0) { entryLines[i].debit = ""; const di = document.querySelector(`.entry-debit[data-index="${i}"]`); if(di) di.value=""; }
      refreshEntryTotals();
    });
    inp.addEventListener("blur", () => refreshEntryLines());
  });
  document.querySelectorAll(".entry-remove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      entryLines.splice(Number(e.target.dataset.index), 1);
      refreshEntryLines();
    });
  });
}

function tabAsiento() {
  initEntryLines();
  return `
    <div class="panel" style="max-width:920px;margin:0 auto">
      <h2>Registrar asiento contable</h2>
      <p class="fin-hint">El total del Debe debe ser igual al total del Haber. Puedes agregar tantas lineas como necesites.</p>
      <form id="entryForm" novalidate>
        <div class="form-grid" style="margin-bottom:16px">
          <label class="field"><span>Fecha</span>
            <input name="entryDate" type="date" value="${new Date().toISOString().slice(0,10)}" required /></label>
          <label class="field"><span>Tipo de comprobante</span>
            <select name="voucherType">
              <option value="traspaso">Traspaso / Diario</option>
              <option value="ingreso">Comprobante de Ingreso</option>
              <option value="egreso">Comprobante de Egreso</option>
            </select></label>
          <label class="field span-2"><span>Descripcion del asiento</span>
            <input name="description" placeholder="Ej: Pago de proveedor desde banco" required /></label>
        </div>
        <div class="entry-lines-table">
          <div class="entry-lines-header">
            <span>Cuenta contable</span>
            <span class="num">Debe (Bs)</span>
            <span class="num">Haber (Bs)</span>
            <span></span>
          </div>
          <div id="entryLinesBody">${renderEntryLinesHTML()}</div>
        </div>
        <div class="entry-totals-bar">
          <button type="button" class="small-btn" id="addLineBtn">+ Anadir linea</button>
          <div id="entryTotals" style="display:flex;align-items:center;font-size:14px;flex-wrap:wrap;gap:6px">
            <span>Total Debe: <strong style="color:var(--ok)">${money.format(0)}</strong></span>
            <span style="margin:0 12px">Total Haber: <strong style="color:var(--danger)">${money.format(0)}</strong></span>
            <span class="status danger">Ingresa montos</span>
          </div>
        </div>
        <div class="toolbar" style="margin-top:14px">
          <button class="primary-btn" type="submit" id="entrySubmit">Registrar asiento</button>
          <span id="entryMessage" class="form-message"></span>
        </div>
      </form>
    </div>
  `;
}

function tabCuentas() {
  return `
    <div class="panel" style="margin-bottom:16px">
      <div class="acc-add-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
        <h2 style="margin:0;font-size:18px">Administrar cuenta</h2>
      </div>
      <p class="fin-hint">Agrega o edita cuentas del catalogo contable.</p>
      <form id="accountForm" class="acc-add-form">
        <label class="field"><span>Codigo</span><input name="code" placeholder="Ej: 1003" required /></label>
        <label class="field"><span>Nombre</span><input name="name" placeholder="Ej: Caja chica" required /></label>
        <label class="field"><span>Tipo</span>
          <select name="type" required>
            <option value="asset">Activo</option><option value="liability">Pasivo</option>
            <option value="equity">Patrimonio</option><option value="income">Ingreso</option>
            <option value="expense">Gasto</option>
          </select></label>
        <div class="acc-add-actions">
          <button class="primary-btn" type="submit" id="accountSubmit">Guardar cuenta</button>
          <span id="accountMessage" class="form-message"></span>
        </div>
      </form>
    </div>
    <div class="panel">
      <h2>Plan de cuentas</h2>
      <p class="fin-hint">Cuentas registradas en el catalogo contable actual.</p>
      <div class="accounts-grid">
        ${["asset","liability","equity","income","expense"].map(type => {
          const group = financeState.accounts.filter(a => a.type === type);
          if (!group.length) return "";
          return `
            <div class="acc-group">
              <div class="acc-group-header acc-type-${type}">${typeLabel(type)}s</div>
              ${group.map(a => `
                <div class="acc-card" style="display:flex;justify-content:space-between;align-items:center">
                  <div><code class="acc-code">${a.code}</code><span class="acc-name">${a.name}</span></div>
                  <div style="display:flex;gap:4px">
                    <button type="button" class="small-btn edit-acc" style="font-size:.75rem;padding:2px 6px"
                      data-id="${a.id}" data-code="${a.code}" data-name="${a.name}" data-type="${a.type}">Editar</button>
                    <button type="button" class="small-btn del-acc" style="font-size:.75rem;padding:2px 6px"
                      data-id="${a.id}">Borrar</button>
                  </div>
                </div>
              `).join("")}
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function tabDiario() {
  const rows = financeState.journal;
  const voucherBadge = v => `<span class="status ${v==="ingreso"?"ok":v==="egreso"?"danger":"info"}" style="font-size:11px">${v||"traspaso"}</span>`;
  if (!rows.length) return `${dateFilterBar()}<div class="notice">No hay asientos en el periodo seleccionado.</div>`;
  const grouped = groupBy(rows, r => r.entry_id);
  return `
    <div class="panel">
      <h2>Libro Diario</h2>
      ${dateFilterBar()}
      <p class="fin-hint">${rows.length} lineas &mdash; ${Object.keys(grouped).length} asientos</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Fecha</th><th>Tipo</th><th>Descripcion</th><th>Cuenta</th><th class="num">Debe</th><th class="num">Haber</th><th>Usuario</th></tr></thead>
          <tbody>
            ${Object.entries(grouped).map(([id, lines]) => lines.map((row, i) => `
              <tr class="${i===0?"diario-first":""}">
                <td class="muted-cell">${i===0?id:""}</td>
                <td>${i===0?formatDate(row.entry_date):""}</td>
                <td>${i===0?voucherBadge(row.voucher_type):""}</td>
                <td>${i===0?row.description:""}</td>
                <td>${row.account_code} &mdash; ${row.account_name}</td>
                <td class="num ${row.debit>0?"debit-cell":""}">${row.debit>0?money.format(row.debit):""}</td>
                <td class="num ${row.credit>0?"credit-cell":""}">${row.credit>0?money.format(row.credit):""}</td>
                <td class="muted-cell">${i===0?row.created_by:""}</td>
              </tr>
            `).join("")).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function tabMayor() {
  const ledger = financeState.ledger;
  return `
    <div class="panel">
      <h2>Libro Mayor</h2>
      ${dateFilterBar()}
      <p class="fin-hint">Saldo acumulado por cuenta contable.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Codigo</th><th>Cuenta</th><th>Tipo</th><th class="num">Debe acum.</th><th class="num">Haber acum.</th><th class="num">Saldo</th></tr></thead>
          <tbody>
            ${ledger.map(row => {
              const positive = row.balance >= 0;
              return `<tr>
                <td><code>${row.account_code}</code></td>
                <td>${row.account_name}</td>
                <td><span class="status ${accountTypeClass(row.account_type)}">${typeLabel(row.account_type)}</span></td>
                <td class="num">${money.format(row.debit)}</td>
                <td class="num">${money.format(row.credit)}</td>
                <td class="num bold ${positive?"debit-cell":"credit-cell"}">${money.format(row.balance)}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function tabBalance() {
  const { assets, liabilities, equity, totals } = financeState.balance;
  const balanced = Math.abs(totals.assets - totals.liabilitiesAndEquity) < 0.01;
  return `
    <div class="panel">
      <h2>Balance General</h2>
      ${dateFilterBar()}
      <p class="fin-hint">Activos = Pasivos + Patrimonio${finDateFrom||finDateTo?" (periodo filtrado)":""}</p>
      <div class="balance-sheet">
        <div class="bs-col">
          <div class="bs-header">ACTIVOS</div>
          ${assets.map(r => balanceLine(r)).join("")}
          <div class="bs-subtotal"><span>Total Activos</span><strong>${money.format(totals.assets)}</strong></div>
        </div>
        <div class="bs-col">
          <div class="bs-header">PASIVOS</div>
          ${liabilities.map(r => balanceLine(r)).join("")}
          <div class="bs-subtotal"><span>Total Pasivos</span><strong>${money.format(totals.liabilities)}</strong></div>
          <div class="bs-header" style="margin-top:18px">PATRIMONIO</div>
          ${equity.map(r => balanceLine(r)).join("")}
          <div class="bs-subtotal"><span>Total Patrimonio</span><strong>${money.format(totals.equity)}</strong></div>
          <div class="bs-subtotal bs-grand"><span>Pasivo + Patrimonio</span><strong>${money.format(totals.liabilitiesAndEquity)}</strong></div>
        </div>
      </div>
      <div class="bs-check">
        <span class="status ${balanced?"ok":"danger"}">${balanced?"\u2713 Balance cuadrado":"\u2717 Diferencia: " + money.format(Math.abs(totals.assets - totals.liabilitiesAndEquity))}</span>
      </div>
    </div>
  `;
}

function tabResultados() {
  const { totals } = financeState.balance;
  const ledger = financeState.ledger;
  const incomeRows = ledger.filter(r => r.account_type === "income");
  const expenseRows = ledger.filter(r => r.account_type === "expense");
  const net = totals.netIncome;
  return `
    <div class="panel">
      <h2>Estado de Resultados</h2>
      ${dateFilterBar()}
      <p class="fin-hint">Resultado del periodo${finDateFrom||finDateTo?" filtrado":""} registrado en el sistema.</p>
      <div class="income-stmt">
        <div class="is-section">
          <div class="is-header">INGRESOS</div>
          ${incomeRows.map(r => `<div class="is-row"><span>${r.account_code} &mdash; ${r.account_name}</span><strong class="debit-cell">${money.format(r.balance)}</strong></div>`).join("")}
          <div class="is-subtotal"><span>Total ingresos</span><strong>${money.format(totals.income)}</strong></div>
        </div>
        <div class="is-section">
          <div class="is-header">GASTOS Y COSTOS</div>
          ${expenseRows.map(r => `<div class="is-row"><span>${r.account_code} &mdash; ${r.account_name}</span><strong class="credit-cell">${money.format(r.balance)}</strong></div>`).join("")}
          <div class="is-subtotal"><span>Total gastos</span><strong>${money.format(totals.expenses)}</strong></div>
        </div>
        <div class="is-net ${net>=0?"net-profit":"net-loss"}">
          <span>${net>=0?"UTILIDAD NETA":"PERDIDA NETA"}</span>
          <strong>${money.format(Math.abs(net))}</strong>
        </div>
      </div>
    </div>
  `;
}

async function saveEntry(event) {
  event.preventDefault();
  const msg = document.querySelector("#entryMessage");
  const btn = document.querySelector("#entrySubmit");
  const form = new FormData(event.currentTarget);
  
  if (!form.get("entryDate") || !form.get("description").trim()) {
    msg.textContent = "Faltan campos obligatorios (Fecha o Descripcion).";
    msg.style.color = "var(--danger)";
    return;
  }
  
  const totalDebit  = entryLines.reduce((s, l) => s + Number(l.debit  || 0), 0);
  const totalCredit = entryLines.reduce((s, l) => s + Number(l.credit || 0), 0);
  
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    msg.textContent = "El asiento no esta cuadrado (Debe y Haber no coinciden).";
    msg.style.color = "var(--danger)";
    return;
  }
  if (totalDebit <= 0) {
    msg.textContent = "Debes ingresar montos mayores a cero.";
    msg.style.color = "var(--danger)";
    return;
  }

  const validLines = entryLines.filter(l => l.accountId && (Number(l.debit)>0 || Number(l.credit)>0));
  if (validLines.length < 2) {
    msg.textContent = "Faltan cuentas. Elige al menos 2 cuentas validas con montos.";
    msg.style.color = "var(--danger)";
    return;
  }

  const hasWarn = entryLines.some(line => {
    const bal = financeState.balances.find(b => b.id == line.accountId);
    const credit = Number(line.credit || 0);
    return bal && bal.type === "asset" && credit > 0 && credit > bal.balance;
  });

  if (hasWarn) {
    msg.textContent = "Saldo insuficiente en alguna cuenta de activo.";
    msg.style.color = "var(--danger)";
    return;
  }

  btn.disabled = true; btn.textContent = "Registrando...";
  try {
    await api("/api/finance/entries", {
      method: "POST",
      body: JSON.stringify({
        entryDate: form.get("entryDate"),
        description: form.get("description"),
        voucherType: form.get("voucherType"),
        lines: entryLines.map(l => ({ accountId: l.accountId, debit: Number(l.debit||0), credit: Number(l.credit||0) })),
      }),
    });
    msg.textContent = "Asiento registrado correctamente."; msg.style.color = "var(--ok)";
    entryLines = [];
    await reloadFinance();
  } catch (e) {
    msg.textContent = e.message; msg.style.color = "var(--danger)";
    btn.disabled = false; btn.textContent = "Registrar asiento";
  }
}

async function saveAccount(event) {
  event.preventDefault();
  const msg = document.querySelector("#accountMessage");
  const btn = document.querySelector("#accountSubmit");
  const formEl = document.querySelector("#accountForm");
  const editId = formEl.dataset.editId;
  const formData = new FormData(event.currentTarget);
  btn.disabled = true; btn.textContent = "Guardando...";
  try {
    const url = editId ? "/api/finance/accounts/" + editId : "/api/finance/accounts";
    const method = editId ? "PUT" : "POST";
    await api(url, { method, body: JSON.stringify({ code: formData.get("code"), name: formData.get("name"), type: formData.get("type") }) });
    msg.textContent = editId ? "Cuenta actualizada." : "Cuenta agregada."; msg.style.color = "var(--ok)";
    await reloadFinance();
  } catch (e) {
    msg.textContent = e.message; msg.style.color = "var(--danger)";
    btn.disabled = false; btn.textContent = editId ? "Actualizar cuenta" : "Guardar cuenta";
  }
}

function accountSelect(name) {
  return `<select name="${name}" required>
    <option value="" disabled selected>Selecciona una cuenta</option>
    ${financeState.accounts.map(a => `<option value="${a.id}">${a.code} \u2014 ${a.name} (${typeLabel(a.type)})</option>`).join("")}
  </select>`;
}

function balanceLine(row) {
  return `<div class="bs-row"><span>${row.account_code} \u2014 ${row.account_name}</span><span>${money.format(row.balance)}</span></div>`;
}

function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => { const k = keyFn(item); (acc[k]=acc[k]||[]).push(item); return acc; }, {});
}

function accountTypeClass(type) {
  return { asset:"ok", liability:"danger", equity:"info", income:"ok", expense:"warn" }[type] || "";
}

function stockTable() { return simpleTable(["Codigo","Producto","Lote","Sucursal","Stock","Minimo","Estado"],stock); }

function simpleTable(headers, rows) {
  return `<div class="table-wrap"><table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map((cell,i) => `<td>${formatCell(cell,i,headers.length)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}

function formatCell(cell, index, length) {
  const value = String(cell ?? "");
  if (index === length - 1 && /Activo|Disponible|bajo|Pendiente|Revision|Protegido|descontado|Reservado|Recibido|transito|Permitido|Bloqueado/.test(value)) {
    const type = value.includes("bajo")||value.includes("Pendiente")||value.includes("Revision")?"warn":value.includes("Protegido")?"danger":"ok";
    return `<span class="status ${type}">${value}</span>`;
  }
  return value;
}

function alertRow(title, text, action) {
  return `<div class="alert-row"><div><strong>${title}</strong><p>${text}</p></div><button class="small-btn" type="button">${action}</button></div>`;
}

function movementRow([time, title, product, qty]) {
  return `<div class="movement-row"><strong>${time}</strong><div><strong>${title}</strong><p>${product}</p></div><span class="status ${qty.startsWith("+")?"ok":"warn"}">${qty}</span></div>`;
}

function permissionRow([module, enabled, detail]) {
  return `<div class="permission-row ${enabled?"":"locked"}"><div><strong>${module}</strong><p>${detail}</p></div>
    <label class="status ${enabled?"ok":"danger"}"><input type="checkbox" ${enabled?"checked":""} />${enabled?"Permitido":"Bloqueado"}</label></div>`;
}

function moduleCard(title, text, chips) {
  return `<article class="module-card"><span>${title}</span><h3>${title}</h3><p>${text}</p>
    <div class="chip-row">${chips.map(c => `<span class="chip">${c}</span>`).join("")}</div></article>`;
}

function field(label, type, value) {
  const control = type === "select"
    ? `<select>${value.map(o => `<option>${o}</option>`).join("")}</select>`
    : `<input type="${type}" value="${value}" />`;
  return `<label class="field"><span>${label}</span>${control}</label>`;
}

function bar(label, value, text) {
  return `<div class="bar"><span>${label}</span><div class="bar-track"><div class="bar-fill" style="width:${value}%"></div></div><strong>${text}</strong></div>`;
}

function formatDate(value) { return new Date(value).toLocaleDateString("es-BO", { timeZone: "UTC" }); }

function typeLabel(type) {
  return { asset:"Activo", liability:"Pasivo", equity:"Patrimonio", income:"Ingreso", expense:"Gasto" }[type] || type;
}

function renderUser() {
  if (!auth?.user) return;
  const pill = document.querySelector("#userPill");
  if (!pill) return;
  const initials = auth.user.full_name.slice(0, 2).toUpperCase();
  pill.innerHTML = `
    <span class="user-avatar">${initials}</span>
    <div class="user-info"><strong>${auth.user.full_name}</strong><small>${roleLabel(auth.user.role)}</small></div>
  `;
  pill.onclick = logout;
  pill.title = "Cerrar sesion";
}

function render() {
  if (!auth?.token) { renderLogin(); return; }
  document.body.classList.remove("login-mode");
  renderUser();
  const allowed = getAllowedModules();
  navLinks.forEach(link => {
    link.style.display = allowed.includes(link.dataset.route) ? "" : "none";
  });
  const route = location.hash.replace("#/", "") || "dashboard";
  const safeRoute = allowed.includes(route) ? route : "dashboard";
  if (safeRoute !== route) { location.hash = "#/" + safeRoute; return; }
  const view = views[safeRoute] || views.dashboard;
  pageTitle.textContent = view.title;
  app.innerHTML = view.render();
  navLinks.forEach(link => link.classList.toggle("active", link.dataset.route === safeRoute));
  sidebar.classList.remove("open");
  view.afterRender?.();
}

menuToggle.addEventListener("click", () => sidebar.classList.toggle("open"));
window.addEventListener("hashchange", render);
render();
