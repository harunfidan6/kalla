-- CreateTable
CREATE TABLE "z_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "closed_by_id" TEXT NOT NULL,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cash_total" REAL NOT NULL,
    "card_total" REAL NOT NULL,
    "tx_count" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "z_reports_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pos_sales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "unit_price" REAL NOT NULL,
    "payment_method" TEXT NOT NULL,
    "sold_by_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "z_report_id" TEXT,
    CONSTRAINT "pos_sales_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pos_sales_sold_by_id_fkey" FOREIGN KEY ("sold_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pos_sales_z_report_id_fkey" FOREIGN KEY ("z_report_id") REFERENCES "z_reports" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
