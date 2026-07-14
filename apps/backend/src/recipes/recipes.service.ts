import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const recipes = await this.prisma.recipe.findMany({
      where: { product: { isAvailable: true } },
      include: {
        product: {
          select: { id: true, name: true, price: true, category: { select: { name: true } } },
        },
      },
    });

    return recipes.map((r) => ({
      id: r.id,
      productId: r.productId,
      name: r.product.name,
      category: r.product.category.name,
      price: r.product.price,
      prepTime: r.prepTime,
      difficulty: r.difficulty,
      temp: r.temp,
      allergens: JSON.parse(r.allergens),
      tags: JSON.parse(r.tags),
      proTip: r.proTip,
      ingredients: JSON.parse(r.ingredients),
      steps: JSON.parse(r.steps),
    }));
  }
}
