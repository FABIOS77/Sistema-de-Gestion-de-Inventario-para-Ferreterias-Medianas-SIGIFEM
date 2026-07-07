DROP DATABASE IF EXISTS tornillo_feliz;
CREATE DATABASE tornillo_feliz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tornillo_feliz;

CREATE TABLE users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  password   VARCHAR(100) NOT NULL,
  full_name  VARCHAR(120) NOT NULL,
  role       ENUM('superusuario','administrador','usuario') NOT NULL DEFAULT 'usuario',
  modules    JSON         NOT NULL,
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  code      VARCHAR(20)  NOT NULL UNIQUE,
  name      VARCHAR(120) NOT NULL,
  type      ENUM('asset','liability','equity','income','expense') NOT NULL,
  is_active TINYINT(1)   NOT NULL DEFAULT 1
);

CREATE TABLE journal_entries (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  entry_date   DATE         NOT NULL,
  description  VARCHAR(255) NOT NULL,
  voucher_type ENUM('ingreso','egreso','traspaso') NOT NULL DEFAULT 'traspaso',
  created_by   INT          NOT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE journal_lines_raw (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  entry_id   INT           NOT NULL,
  account_id INT           NOT NULL,
  debit      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  credit     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (entry_id)   REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  CHECK (debit >= 0 AND credit >= 0),
  CHECK (debit > 0 OR credit > 0)
);

CREATE VIEW journal_lines AS
SELECT
  je.id          AS entry_id,
  je.entry_date,
  je.description,
  je.voucher_type,
  je.created_at,
  je.created_by,
  jl.account_id,
  a.code         AS account_code,
  a.name         AS account_name,
  a.type         AS account_type,
  jl.debit,
  jl.credit
FROM journal_lines_raw jl
JOIN journal_entries je ON je.id = jl.entry_id
JOIN accounts        a  ON a.id  = jl.account_id;

INSERT INTO users (username, password, full_name, role, modules) VALUES
('admin', 'admin', 'Administrador General', 'superusuario',
 JSON_ARRAY('dashboard','inventario','compras','ventas','finanzas','usuarios'));

INSERT INTO accounts (code, name, type) VALUES
('1001', 'Caja General',             'asset'),
('1002', 'Banco Union',              'asset'),
('1003', 'Banco Mercantil',          'asset'),
('1101', 'Cuentas por cobrar',       'asset'),
('1201', 'Inventario de mercaderia', 'asset'),
('2001', 'Cuentas por pagar',        'liability'),
('3001', 'Capital social',           'equity'),
('4001', 'Ventas de mercaderia',     'income'),
('4002', 'Otros ingresos',           'income'),
('5001', 'Costo de ventas',          'expense'),
('5002', 'Gastos administrativos',   'expense'),
('5003', 'Gastos de transporte',     'expense');

INSERT INTO journal_entries (entry_date, description, voucher_type, created_by) VALUES
('2026-06-01', 'Aporte inicial de capital a caja', 'ingreso', 1);
INSERT INTO journal_lines_raw (entry_id, account_id, debit, credit) VALUES
(1, 1, 50000.00, 0), (1, 7, 0, 50000.00);

INSERT INTO journal_entries (entry_date, description, voucher_type, created_by) VALUES
('2026-06-05', 'Compra de mercaderia al credito', 'traspaso', 1);
INSERT INTO journal_lines_raw (entry_id, account_id, debit, credit) VALUES
(2, 5, 18420.00, 0), (2, 6, 0, 18420.00);

INSERT INTO journal_entries (entry_date, description, voucher_type, created_by) VALUES
('2026-06-10', 'Venta de mercaderia al contado', 'ingreso', 1);
INSERT INTO journal_lines_raw (entry_id, account_id, debit, credit) VALUES
(3, 1, 2780.00, 0), (3, 8, 0, 2780.00);

INSERT INTO journal_entries (entry_date, description, voucher_type, created_by) VALUES
('2026-06-12', 'Cobranza de cliente en banco', 'ingreso', 1);
INSERT INTO journal_lines_raw (entry_id, account_id, debit, credit) VALUES
(4, 2, 4350.00, 0), (4, 4, 0, 4350.00);

INSERT INTO journal_entries (entry_date, description, voucher_type, created_by) VALUES
('2026-06-15', 'Pago parcial a proveedor desde banco', 'egreso', 1);
INSERT INTO journal_lines_raw (entry_id, account_id, debit, credit) VALUES
(5, 6, 7000.00, 0), (5, 2, 0, 7000.00);

INSERT INTO journal_entries (entry_date, description, voucher_type, created_by) VALUES
('2026-06-18', 'Registro de costo de venta', 'traspaso', 1);
INSERT INTO journal_lines_raw (entry_id, account_id, debit, credit) VALUES
(6, 10, 1200.00, 0), (6, 5, 0, 1200.00);

INSERT INTO journal_entries (entry_date, description, voucher_type, created_by) VALUES
('2026-06-22', 'Pago de transporte de mercaderia', 'egreso', 1);
INSERT INTO journal_lines_raw (entry_id, account_id, debit, credit) VALUES
(7, 12, 380.00, 0), (7, 1, 0, 380.00);
