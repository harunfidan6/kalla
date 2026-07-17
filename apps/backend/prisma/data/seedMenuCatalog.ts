import { PrismaClient } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { categories, products } = require('./menuProducts.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { RECIPES } = require('./menuRecipes.js');

// A handful of recipe names in the source data are shortened versions of the full product
// names (e.g. sandwich recipes omit a secondary ingredient) — map them to their real product.
const RECIPE_NAME_ALIASES: Record<string, string> = {
  'Smoked Salmon Bagel': 'Smoked Salmon & Cream Cheese Bagel',
  'Avocado Sourdough Toast': 'Avocado & Feta Sourdough Toast',
  'Roast Beef Panini': 'Roast Beef & Mustard Panini',
  'Turkey Croissant Sandviç': 'Turkey & Gouda Croissant Sandviç',
  'Hummus & Veggie Wrap': 'Hummus & Roasted Veggie Wrap',
};

export async function seedMenuCatalog(prisma: PrismaClient) {
  const newProductNames = new Set<string>(products.map((p: any) => p.name));

  const categoryRecords: Record<string, { id: string }> = {};
  for (const cat of categories) {
    categoryRecords[cat.name] = await prisma.productCategory.upsert({
      where: { name: cat.name },
      update: { displayOrder: cat.displayOrder },
      create: { name: cat.name, displayOrder: cat.displayOrder },
    });
  }

  // Push any pre-existing categories (from the old demo menu) to the end of the list.
  const oldCategories = await prisma.productCategory.findMany({
    where: { name: { notIn: categories.map((c: any) => c.name) } },
  });
  for (let i = 0; i < oldCategories.length; i++) {
    await prisma.productCategory.update({
      where: { id: oldCategories[i].id },
      data: { displayOrder: 90 + i },
    });
  }

  const productRecords: Record<string, { id: string }> = {};
  for (const p of products) {
    const category = categoryRecords[p.category];
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      productRecords[p.name] = await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: p.description,
          price: p.price,
          categoryId: category.id,
          imageUrl: p.imageUrl ?? existing.imageUrl,
          isAvailable: true,
        },
      });
    } else {
      productRecords[p.name] = await prisma.product.create({
        data: {
          name: p.name,
          description: p.description,
          price: p.price,
          categoryId: category.id,
          imageUrl: p.imageUrl ?? null,
          isAvailable: true,
        },
      });
    }
  }

  // Soft-hide any pre-existing product that isn't part of the new 102-item menu.
  await prisma.product.updateMany({
    where: { name: { notIn: Array.from(newProductNames) } },
    data: { isAvailable: false },
  });

  for (const recipe of RECIPES) {
    const productName = RECIPE_NAME_ALIASES[recipe.name] || recipe.name;
    const product = productRecords[productName];
    if (!product) continue;
    const data = {
      productId: product.id,
      prepTime: recipe.prepTime,
      difficulty: recipe.difficulty,
      temp: recipe.temp ?? null,
      allergens: JSON.stringify(recipe.allergens ?? []),
      tags: JSON.stringify(recipe.tags ?? []),
      proTip: recipe.proTip,
      ingredients: JSON.stringify(recipe.ingredients ?? []),
      steps: JSON.stringify(recipe.steps ?? []),
    };
    await prisma.recipe.upsert({
      where: { productId: product.id },
      update: data,
      create: data,
    });
  }

  console.log(`🍽️  Menü kataloğu: ${products.length} ürün, ${categories.length} kategori, ${RECIPES.length} tarif işlendi.`);
}
