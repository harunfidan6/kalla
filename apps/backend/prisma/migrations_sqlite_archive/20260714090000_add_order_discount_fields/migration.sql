-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
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
    CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("id", "customer_id", "status", "order_type", "payment_status", "subtotal", "discount_amount", "discount_label", "total_amount", "pos_receipt_issued", "notes", "created_at", "updated_at")
SELECT "id", "customer_id", "status", "order_type", "payment_status", "total_amount", 0, NULL, "total_amount", "pos_receipt_issued", "notes", "created_at", "created_at" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
