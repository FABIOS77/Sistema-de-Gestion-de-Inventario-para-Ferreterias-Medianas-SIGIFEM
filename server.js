const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let mysql;
try {
  mysql = require("mysql2/promise");
} catch (error) {
  console.error("Falta instalar mysql2. Ejecuta: npm install");
  process.exit(1);
}

const root = __dirname;
const port = Number(process.env.PORT || 5173);
const sessions = new Map();
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "tornillo_feliz",
  waitForConnections: true,
  connectionLimit: 10,
});

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; if (raw.length > 1_000_000) req.destroy(); });
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

function currentUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  return token ? sessions.get(token) : null;
}

async function requireUser(req, res) {
  const user = currentUser(req);
  if (!user) { sendJson(res, 401, { message: "Sesion no valida." }); return null; }
  return user;
}

async function getAccounts() {
  const [rows] = await pool.query("SELECT id, code, name, type FROM accounts WHERE is_active = 1 ORDER BY code");
  return rows;
}

async function getAccountBalances() {
  const [rows] = await pool.query(`
    SELECT a.id, a.code, a.name, a.type,
      COALESCE(SUM(jl.debit), 0)  AS total_debit,
      COALESCE(SUM(jl.credit), 0) AS total_credit
    FROM accounts a
    LEFT JOIN journal_lines jl ON jl.account_id = a.id
    WHERE a.is_active = 1
    GROUP BY a.id, a.code, a.name, a.type
    ORDER BY a.code
  `);
  return rows.map(row => {
    const debit = Number(row.total_debit);
    const credit = Number(row.total_credit);
    const debitNormal = row.type === "asset" || row.type === "expense";
    return { ...row, total_debit: debit, total_credit: credit, balance: debitNormal ? debit - credit : credit - debit };
  });
}

async function getJournal(from, to) {
  let sql = `
    SELECT jl.entry_id, jl.entry_date, jl.description, jl.voucher_type,
      jl.account_code, jl.account_name, jl.debit, jl.credit,
      u.username AS created_by
    FROM journal_lines jl
    JOIN users u ON u.id = jl.created_by
    WHERE 1=1
  `;
  const params = [];
  if (from) { sql += " AND jl.entry_date >= ?"; params.push(from); }
  if (to)   { sql += " AND jl.entry_date <= ?"; params.push(to); }
  sql += " ORDER BY jl.entry_date DESC, jl.entry_id DESC, jl.debit DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getLedger(from, to) {
  let sql = `
    SELECT account_id, account_code, account_name, account_type,
      SUM(debit) AS debit, SUM(credit) AS credit
    FROM journal_lines WHERE 1=1
  `;
  const params = [];
  if (from) { sql += " AND entry_date >= ?"; params.push(from); }
  if (to)   { sql += " AND entry_date <= ?"; params.push(to); }
  sql += " GROUP BY account_id, account_code, account_name, account_type ORDER BY account_code";
  const [rows] = await pool.query(sql, params);
  return rows.map(row => {
    const debit = Number(row.debit);
    const credit = Number(row.credit);
    const debitNormal = row.account_type === "asset" || row.account_type === "expense";
    return { ...row, debit, credit, balance: debitNormal ? debit - credit : credit - debit };
  });
}

async function getBalanceSheet(from, to) {
  const ledger = await getLedger(from, to);
  const assets = ledger.filter(r => r.account_type === "asset");
  const liabilities = ledger.filter(r => r.account_type === "liability");
  const equityAccounts = ledger.filter(r => r.account_type === "equity");
  const income = ledger.filter(r => r.account_type === "income").reduce((s, r) => s + r.balance, 0);
  const expenses = ledger.filter(r => r.account_type === "expense").reduce((s, r) => s + r.balance, 0);
  const retainedEarnings = income - expenses;
  const equity = [...equityAccounts, {
    account_code: "3999", account_name: "Resultado acumulado",
    account_type: "equity", debit: 0, credit: retainedEarnings, balance: retainedEarnings,
  }];
  const total = rows => rows.reduce((s, r) => s + Number(r.balance), 0);
  return {
    assets, liabilities, equity,
    totals: {
      assets: total(assets), liabilities: total(liabilities), equity: total(equity),
      liabilitiesAndEquity: total(liabilities) + total(equity),
      income, expenses, netIncome: retainedEarnings,
    },
  };
}

async function handleApi(req, res, url) {
  try {
    if (req.method === "POST" && url.pathname === "/api/login") {
      const body = await readBody(req);
      const [users] = await pool.query(
        "SELECT id, username, password, full_name, role, modules FROM users WHERE username = ? AND password = ? AND is_active = 1 LIMIT 1",
        [body.username, body.password]
      );
      if (!users.length) { sendJson(res, 401, { message: "Credenciales incorrectas." }); return; }
      const u = users[0];
      u.modules = typeof u.modules === "string" ? JSON.parse(u.modules) : (u.modules || []);
      const token = crypto.randomBytes(24).toString("hex");
      sessions.set(token, u);
      sendJson(res, 200, { token, user: u });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/logout") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) sessions.delete(token);
      sendJson(res, 200, { ok: true });
      return;
    }

    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === "GET" && url.pathname === "/api/me") {
      sendJson(res, 200, { user });
      return;
    }

    // ── Finance ───────────────────────────────────────────
    if (req.method === "GET" && url.pathname === "/api/finance") {
      const from = url.searchParams.get("from") || null;
      const to   = url.searchParams.get("to")   || null;
      const [accounts, journal, ledger, balance, balances] = await Promise.all([
        getAccounts(), getJournal(from, to), getLedger(from, to),
        getBalanceSheet(from, to), getAccountBalances(),
      ]);
      sendJson(res, 200, { accounts, journal, ledger, balance, balances });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/finance/balances") {
      sendJson(res, 200, { balances: await getAccountBalances() });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/finance/entries") {
      const body = await readBody(req);
      const { entryDate, description, voucherType, lines } = body;
      if (!entryDate || !description || !Array.isArray(lines) || lines.length < 2) {
        sendJson(res, 400, { message: "Se requiere fecha, descripcion y al menos 2 lineas." }); return;
      }
      const totalDebit  = lines.reduce((s, l) => s + Number(l.debit  || 0), 0);
      const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        sendJson(res, 400, { message: "El Debe (" + totalDebit.toFixed(2) + ") debe ser igual al Haber (" + totalCredit.toFixed(2) + ")." }); return;
      }
      if (totalDebit <= 0) { sendJson(res, 400, { message: "El monto total debe ser mayor a cero." }); return; }
      const validVouchers = ["ingreso", "egreso", "traspaso"];
      const voucher = validVouchers.includes(voucherType) ? voucherType : "traspaso";
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [result] = await conn.query(
          "INSERT INTO journal_entries (entry_date, description, voucher_type, created_by) VALUES (?, ?, ?, ?)",
          [entryDate, description, voucher, user.id]
        );
        const entryId = result.insertId;
        for (const line of lines) {
          const debit  = Number(line.debit  || 0);
          const credit = Number(line.credit || 0);
          if (!line.accountId || (debit === 0 && credit === 0)) continue;
          await conn.query(
            "INSERT INTO journal_lines_raw (entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)",
            [entryId, line.accountId, debit, credit]
          );
        }
        await conn.commit();
        sendJson(res, 201, { ok: true });
      } catch (err) { await conn.rollback(); throw err; }
      finally { conn.release(); }
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/finance/accounts") {
      const body = await readBody(req);
      if (!body.code || !body.name || !body.type) { sendJson(res, 400, { message: "Codigo, nombre y tipo son obligatorios." }); return; }
      const validTypes = ["asset","liability","equity","income","expense"];
      if (!validTypes.includes(body.type)) { sendJson(res, 400, { message: "Tipo invalido." }); return; }
      try {
        await pool.query("INSERT INTO accounts (code, name, type) VALUES (?, ?, ?)", [body.code.trim(), body.name.trim(), body.type]);
        sendJson(res, 201, { ok: true });
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") sendJson(res, 409, { message: "El codigo " + body.code + " ya existe." });
        else throw err;
      }
      return;
    }

    if (req.method === "PUT" && url.pathname.startsWith("/api/finance/accounts/")) {
      const id = url.pathname.split("/").pop();
      const body = await readBody(req);
      if (!body.code || !body.name || !body.type) { sendJson(res, 400, { message: "Codigo, nombre y tipo son obligatorios." }); return; }
      const validTypes = ["asset","liability","equity","income","expense"];
      if (!validTypes.includes(body.type)) { sendJson(res, 400, { message: "Tipo invalido." }); return; }
      try {
        await pool.query("UPDATE accounts SET code = ?, name = ?, type = ? WHERE id = ?", [body.code.trim(), body.name.trim(), body.type, id]);
        sendJson(res, 200, { ok: true });
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") sendJson(res, 409, { message: "El codigo " + body.code + " ya existe." });
        else throw err;
      }
      return;
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/finance/accounts/")) {
      const id = url.pathname.split("/").pop();
      await pool.query("UPDATE accounts SET is_active = 0 WHERE id = ?", [id]);
      sendJson(res, 200, { ok: true });
      return;
    }

    // ── Users (solo superusuario) ─────────────────────────
    if (url.pathname.startsWith("/api/users")) {
      if (user.role !== "superusuario") { sendJson(res, 403, { message: "Sin permisos para gestionar usuarios." }); return; }

      if (req.method === "GET" && url.pathname === "/api/users") {
        const [rows] = await pool.query("SELECT id, username, password, full_name, role, modules, is_active FROM users ORDER BY id");
        rows.forEach(r => { r.modules = typeof r.modules === "string" ? JSON.parse(r.modules) : (r.modules || []); });
        sendJson(res, 200, { users: rows });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/users") {
        const body = await readBody(req);
        if (!body.username || !body.password || !body.full_name || !body.role) {
          sendJson(res, 400, { message: "Todos los campos son obligatorios." }); return;
        }
        if (!["administrador","usuario"].includes(body.role)) { sendJson(res, 400, { message: "Rol invalido." }); return; }
        const modules = body.role === "administrador"
          ? ["dashboard","inventario","compras","ventas","finanzas"]
          : (Array.isArray(body.modules) ? body.modules : ["dashboard"]);
        try {
          await pool.query(
            "INSERT INTO users (username, password, full_name, role, modules) VALUES (?, ?, ?, ?, ?)",
            [body.username.trim(), body.password, body.full_name.trim(), body.role, JSON.stringify(modules)]
          );
          sendJson(res, 201, { ok: true });
        } catch (err) {
          if (err.code === "ER_DUP_ENTRY") sendJson(res, 409, { message: "El usuario " + body.username + " ya existe." });
          else throw err;
        }
        return;
      }

      if (req.method === "PUT" && url.pathname.startsWith("/api/users/")) {
        const id = url.pathname.split("/").pop();
        const body = await readBody(req);
        if (!body.username || !body.password || !body.full_name || !body.role) {
          sendJson(res, 400, { message: "Todos los campos son obligatorios." }); return;
        }
        if (!["administrador","usuario"].includes(body.role)) { sendJson(res, 400, { message: "Rol invalido." }); return; }
        const modules = body.role === "administrador"
          ? ["dashboard","inventario","compras","ventas","finanzas"]
          : (Array.isArray(body.modules) ? body.modules : ["dashboard"]);
        try {
          await pool.query(
            "UPDATE users SET username = ?, password = ?, full_name = ?, role = ?, modules = ?, is_active = ? WHERE id = ?",
            [body.username.trim(), body.password, body.full_name.trim(), body.role, JSON.stringify(modules), body.is_active ? 1 : 0, id]
          );
          sendJson(res, 200, { ok: true });
        } catch (err) {
          if (err.code === "ER_DUP_ENTRY") sendJson(res, 409, { message: "El usuario " + body.username + " ya existe." });
          else throw err;
        }
        return;
      }

      if (req.method === "DELETE" && url.pathname.startsWith("/api/users/")) {
        const id = url.pathname.split("/").pop();
        if (Number(id) === user.id) { sendJson(res, 400, { message: "No puedes eliminarte a ti mismo." }); return; }
        await pool.query("UPDATE users SET is_active = 0 WHERE id = ?", [id]);
        sendJson(res, 200, { ok: true });
        return;
      }
    }

    sendJson(res, 404, { message: "Ruta API no encontrada." });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { message: "Error del servidor.", detail: error.message });
  }
}

function serveStatic(req, res, url) {
  const route = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const filePath = path.resolve(root, route);
  if (!filePath.startsWith(root)) { res.writeHead(403); res.end("Forbidden"); return; }
  fs.readFile(filePath, (error, data) => {
    if (error) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:" + port);
  if (url.pathname.startsWith("/api/")) { handleApi(req, res, url); return; }
  serveStatic(req, res, url);
}).listen(port, "127.0.0.1", () => {
  console.log("Tornillo Feliz listo en http://127.0.0.1:" + port);
});
