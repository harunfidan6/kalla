-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pos_sales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT,
    "description" TEXT,
    "unit_price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "payment_method" TEXT NOT NULL,
    "sold_by_id" TEXT NOT NULL,
    "order_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "z_report_id" TEXT,
    CONSTRAINT "pos_sales_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pos_sales_sold_by_id_fkey" FOREIGN KEY ("sold_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pos_sales_z_report_id_fkey" FOREIGN KEY ("z_report_id") REFERENCES "z_reports" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pos_sales_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_pos_sales" ("created_at", "id", "payment_method", "product_id", "sold_by_id", "unit_price", "z_report_id") SELECT "created_at", "id", "payment_method", "product_id", "sold_by_id", "unit_price", "z_report_id" FROM "pos_sales";
DROP TABLE "pos_sales";
ALTER TABLE "new_pos_sales" RENAME TO "pos_sales";
CREATE UNIQUE INDEX "pos_sales_order_id_key" ON "pos_sales"("order_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
