-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed the 4 branches (real Istanbul districts, spread across both sides of the Bosphorus)
INSERT INTO "branches" ("id", "name", "address", "city", "district", "latitude", "longitude") VALUES
('ec8641dc-6f07-4d0b-886b-6ce08c69f91d', 'Kadıköy Şube', 'Caferağa Mah. Moda Cad. No:12', 'İstanbul', 'Kadıköy', 40.9903, 29.0275),
('9e2491d8-f85f-482a-95fd-45b1d1288ca0', 'Beşiktaş Şube', 'Sinanpaşa Mah. Beşiktaş Cad. No:5', 'İstanbul', 'Beşiktaş', 41.0422, 29.0061),
('cd356b15-28d6-4ce7-b6af-42568d65ff36', 'Şişli Şube', 'Halaskargazi Mah. Rumeli Cad. No:45', 'İstanbul', 'Şişli', 41.0602, 28.9877),
('4064b63b-23b1-41d9-9ade-628d2a3f86e4', 'Ümraniye Şube', 'İstiklal Mah. Alemdağ Cad. No:78', 'İstanbul', 'Ümraniye', 41.0165, 29.1240);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "order_type" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "discount_amount" REAL NOT NULL DEFAULT 0,
    "discount_label" TEXT,
    "total_amount" REAL NOT NULL,
    "pos_receipt_issued" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("id", "customer_id", "branch_id", "status", "order_type", "payment_status", "subtotal", "discount_amount", "discount_label", "total_amount", "pos_receipt_issued", "notes", "created_at", "updated_at")
SELECT "id", "customer_id", 'ec8641dc-6f07-4d0b-886b-6ce08c69f91d', "status", "order_type", "payment_status", "subtotal", "discount_amount", "discount_label", "total_amount", "pos_receipt_issued", "notes", "created_at", "updated_at" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";

CREATE TABLE "new_pos_sales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT,
    "branch_id" TEXT NOT NULL,
    "description" TEXT,
    "unit_price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "payment_method" TEXT NOT NULL,
    "sold_by_id" TEXT NOT NULL,
    "order_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "z_report_id" TEXT,
    CONSTRAINT "pos_sales_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pos_sales_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pos_sales_sold_by_id_fkey" FOREIGN KEY ("sold_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pos_sales_z_report_id_fkey" FOREIGN KEY ("z_report_id") REFERENCES "z_reports" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pos_sales_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_pos_sales" ("id", "product_id", "branch_id", "description", "unit_price", "quantity", "payment_method", "sold_by_id", "order_id", "created_at", "z_report_id")
SELECT "id", "product_id", 'ec8641dc-6f07-4d0b-886b-6ce08c69f91d', "description", "unit_price", "quantity", "payment_method", "sold_by_id", "order_id", "created_at", "z_report_id" FROM "pos_sales";
DROP TABLE "pos_sales";
ALTER TABLE "new_pos_sales" RENAME TO "pos_sales";
CREATE UNIQUE INDEX "pos_sales_order_id_key" ON "pos_sales"("order_id");

CREATE TABLE "new_shifts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staff_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    CONSTRAINT "shifts_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "shifts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_shifts" ("id", "staff_id", "branch_id", "start_time", "end_time", "status")
SELECT "id", "staff_id", 'ec8641dc-6f07-4d0b-886b-6ce08c69f91d', "start_time", "end_time", "status" FROM "shifts";
DROP TABLE "shifts";
ALTER TABLE "new_shifts" RENAME TO "shifts";

CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "full_name" TEXT NOT NULL,
    "branch_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("id", "email", "phone", "password_hash", "role", "full_name", "branch_id", "created_at", "updated_at")
SELECT "id", "email", "phone", "password_hash", "role", "full_name",
  CASE
    WHEN "id" = 'bdff3d83-b947-4e6c-80cc-e8ef43a07817' THEN 'ec8641dc-6f07-4d0b-886b-6ce08c69f91d'
    WHEN "id" = '14b4e2e4-d097-426f-8505-be677d3084f8' THEN '9e2491d8-f85f-482a-95fd-45b1d1288ca0'
    ELSE NULL
  END,
  "created_at", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

CREATE TABLE "new_z_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "closed_by_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cash_total" REAL NOT NULL,
    "card_total" REAL NOT NULL,
    "tx_count" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "z_reports_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "z_reports_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_z_reports" ("id", "closed_by_id", "branch_id", "period_start", "period_end", "cash_total", "card_total", "tx_count", "created_at")
SELECT "id", "closed_by_id", 'ec8641dc-6f07-4d0b-886b-6ce08c69f91d', "period_start", "period_end", "cash_total", "card_total", "tx_count", "created_at" FROM "z_reports";
DROP TABLE "z_reports";
ALTER TABLE "new_z_reports" RENAME TO "z_reports";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Seed one staff member for each of the 2 remaining branches (Kadıköy=bob, Beşiktaş=alice already
-- assigned above), so all 4 branches start with an assigned staff member.
INSERT INTO "users" ("id", "email", "phone", "password_hash", "role", "full_name", "branch_id", "created_at", "updated_at") VALUES
('19565a20-01a5-4c0b-8a15-f830fc7c97c0', 'deniz@kafe.com', '+905556665544', '$2b$10$jP.mLorqRripvKfPYhGI9OBPJ/TqcbpMgS3lCAuYk1QbvDMAR6/JW', 'staff', 'Barista Deniz', 'cd356b15-28d6-4ce7-b6af-42568d65ff36', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('3f41417d-576a-472e-9318-941f9f21a74a', 'ece@kafe.com', '+905553334422', '$2b$10$jP.mLorqRripvKfPYhGI9OBPJ/TqcbpMgS3lCAuYk1QbvDMAR6/JW', 'staff', 'Barista Ece', '4064b63b-23b1-41d9-9ade-628d2a3f86e4', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "staff_profiles" ("user_id", "position", "employee_code", "hire_date") VALUES
('19565a20-01a5-4c0b-8a15-f830fc7c97c0', 'Barista', 'EMP-4444', CURRENT_TIMESTAMP),
('3f41417d-576a-472e-9318-941f9f21a74a', 'Barista', 'EMP-5555', CURRENT_TIMESTAMP);

INSERT INTO "wallets" ("id", "user_id", "balance", "created_at", "updated_at") VALUES
('branch-seed-wallet-deniz', '19565a20-01a5-4c0b-8a15-f830fc7c97c0', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('branch-seed-wallet-ece', '3f41417d-576a-472e-9318-941f9f21a74a', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
