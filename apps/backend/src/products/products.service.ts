import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAllCategories() {
    return this.prisma.productCategory.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findAllProducts(categoryId?: string) {
    const where: any = { isAvailable: true };
    if (categoryId) {
      where.categoryId = categoryId;
    }
    return this.prisma.product.findMany({
      where,
      include: {
        category: true,
      },
    });
  }

  async findProductById(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, isAvailable: true },
      include: {
        category: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Ürün bulunamadı veya satışta değil');
    }
    return product;
  }
}
