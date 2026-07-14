import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PaymentMethod } from '@kafe/shared-types';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async createSale(userId: string, branchId: string, dto: CreateSaleDto) {
    // Fiyat asla istemciden alınmaz — ürün sunucudan yüklenir (otoriter fiyat).
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isAvailable: true },
    });
    if (!product) {
      throw new NotFoundException('Ürün bulunamadı veya satışta değil');
    }

    return this.prisma.posSale.create({
      data: {
        productId: product.id,
        branchId,
        unitPrice: product.price,
        paymentMethod: dto.paymentMethod,
        soldById: userId,
      },
      include: { product: { select: { name: true } } },
    });
  }

  async getToday(branchId: string) {
    // "Bugünkü satış" = henüz bir Z raporuna bağlanmamış (açık) tüm satışlar — tezgahtan
    // elle girilenler VE müşteri uygulamasından "Teslim Et" ile kasaya düşen sipariş kayıtları.
    // Yalnızca çağıranın kendi şubesine ait.
    const openSales = await this.prisma.posSale.findMany({
      where: { branchId, zReportId: null },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    let cashTotal = 0;
    let cardTotal = 0;
    const byLine: Record<string, { key: string; name: string; count: number; total: number }> = {};

    for (const sale of openSales) {
      const lineTotal = sale.unitPrice * sale.quantity;
      if (sale.paymentMethod === PaymentMethod.CASH) cashTotal += lineTotal;
      else cardTotal += lineTotal;

      // Sipariş kaynaklı kayıtlar kendi satırında kalır (her biri tek bir siparişe bağlı,
      // benzersiz orderId); elle girilen tezgah satışları ürüne göre gruplanır.
      const key = sale.productId ?? sale.id;
      if (!byLine[key]) {
        byLine[key] = { key, name: sale.product?.name ?? sale.description ?? 'Diğer', count: 0, total: 0 };
      }
      byLine[key].count += sale.quantity;
      byLine[key].total += lineTotal;
    }

    return {
      cashTotal,
      cardTotal,
      total: cashTotal + cardTotal,
      txCount: openSales.length,
      items: Object.values(byLine),
      periodStart: openSales.length > 0 ? openSales[0].createdAt : null,
    };
  }

  async closeDay(userId: string, branchId: string) {
    return this.prisma.$transaction(async (tx) => {
      const openSales = await tx.posSale.findMany({
        where: { branchId, zReportId: null },
        orderBy: { createdAt: 'asc' },
      });

      if (openSales.length === 0) {
        throw new BadRequestException('Kapatılacak açık satış bulunmuyor.');
      }

      let cashTotal = 0;
      let cardTotal = 0;
      for (const sale of openSales) {
        const lineTotal = sale.unitPrice * sale.quantity;
        if (sale.paymentMethod === PaymentMethod.CASH) cashTotal += lineTotal;
        else cardTotal += lineTotal;
      }

      const report = await tx.zReport.create({
        data: {
          closedById: userId,
          branchId,
          periodStart: openSales[0].createdAt,
          periodEnd: new Date(),
          cashTotal,
          cardTotal,
          txCount: openSales.length,
        },
      });

      await tx.posSale.updateMany({
        where: { id: { in: openSales.map((s) => s.id) } },
        data: { zReportId: report.id },
      });

      return this.findReportWithSales(tx, report.id);
    });
  }

  // branchId verilirse yalnızca o şubenin raporları döner (personel her zaman kendi şubesini
  // gönderir); admin app'in çapraz şube görünümü için branchId boş bırakılabilir (tüm şubeler).
  async getReports(branchId?: string) {
    return this.prisma.zReport.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        closedBy: { select: { fullName: true } },
        branch: { select: { id: true, name: true } },
        sales: { include: { product: { select: { name: true } } } },
      },
    });
  }

  private findReportWithSales(tx: any, reportId: string) {
    return tx.zReport.findUnique({
      where: { id: reportId },
      include: {
        closedBy: { select: { fullName: true } },
        sales: { include: { product: { select: { name: true } } } },
      },
    });
  }
}
