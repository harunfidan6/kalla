-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "prep_time" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "temp" TEXT,
    "allergens" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "pro_tip" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    CONSTRAINT "recipes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "recipes_product_id_key" ON "recipes"("product_id");

