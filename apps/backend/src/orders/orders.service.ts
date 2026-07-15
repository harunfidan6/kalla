import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { OrderStatus, LoyaltyTier, Role, PaymentStatus, PaymentMethod } from '@kafe/shared-types';
import { EventsGateway } from '../gateway/events.gateway';

// Sadakat kademesi indirim oranları — tüm siparişlere, her zaman uygulanır (koşullu
// gün/kategori kuralı yok, iş kararı basit tutuldu).
const TIER_DISCOUNT_RATES: Record<string, number> = {
  [LoyaltyTier.BRONZE]: 0,
  [LoyaltyTier.SILVER]: 0.15,
  [LoyaltyTier.GOLD]: 0.3,
};

const TIER_DISCOUNT_LABELS: Record<string, string> = {
  [LoyaltyTier.SILVER]: 'Gümüş Üye İndirimi (%15)',
  [LoyaltyTier.GOLD]: 'Altın Üye İndirimi (%30)',
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const { branchId, orderType, paymentStatus, notes, items } = createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Sipariş sepeti boş olamaz');
    }

    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      throw new NotFoundException('Şube bulunamadı');
    }

    // Process order in a transaction to ensure database consistency
    const order = await this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsToCreate = [];

      // 1. Validate products and calculate subtotal
      for (const item of items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, isAvailable: true },
        });

        if (!product) {
          throw new NotFoundException(`Ürün bulunamadı veya satışta değil: ${item.productId}`);
        }

        let adjustedUnitPrice = product.price;

        if (item.options) {
          try {
            const opts = typeof item.options === 'string' ? JSON.parse(item.options) : item.options;
            // Espresso ve Türk Kahvesi tek üründe Tek/Çift seçimiyle satılır — boy/süt/ekstra
            // shot bu ürünlerde anlamsız olduğundan atlanır (client de bu seçenekleri göstermez).
            if (product.name === 'Espresso' || product.name === 'Türk Kahvesi') {
              if (opts.size === 'Çift') {
                adjustedUnitPrice += 15.0;
              }
            } else {
              if (opts.milk === 'Yulaf' || opts.milk === 'Badem') {
                adjustedUnitPrice += 10.0;
              }
              if (opts.extraShot === '1 Shot') {
                adjustedUnitPrice += 15.0;
              } else if (opts.extraShot === '2 Shot') {
                adjustedUnitPrice += 30.0;
              }
              if (opts.size === 'Küçük') {
                adjustedUnitPrice -= 5.0;
              } else if (opts.size === 'Büyük') {
                adjustedUnitPrice += 10.0;
              }
            }
          } catch (e) {
            console.error('Error parsing order item options for pricing:', e);
          }
        }

        const itemTotal = adjustedUnitPrice * item.quantity;
        subtotal += itemTotal;

        orderItemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: adjustedUnitPrice,
          options: typeof item.options === 'string' ? item.options : JSON.stringify(item.options) || null,
        });
      }

      // 2. Sadakat kademesine göre indirim hesapla — tamamen sunucu tarafında, DB'deki
      // loyaltyTier'a dayanır, istemciden gelen hiçbir veriyle etkilenmez (sahtecilik yapılamaz).
      const customerProfile = await tx.customerProfile.findUnique({
        where: { userId },
      });

      const tier = customerProfile?.loyaltyTier ?? LoyaltyTier.BRONZE;
      const discountRate = TIER_DISCOUNT_RATES[tier] ?? 0;
      const discountAmount = Math.round(subtotal * discountRate * 100) / 100;
      const totalAmount = Math.round((subtotal - discountAmount) * 100) / 100;
      const discountLabel = discountRate > 0 ? TIER_DISCOUNT_LABELS[tier] : null;

      // 3. Create Order
      // Online ödemeli siparişler, gerçek ödeme checkout() içinde onaylanana kadar
      // "pending_payment" durumunda kalır — personel Kanban'ı bu durumu göstermez
      // (bkz. findAllActiveOrders), aksi halde müşteri kart bilgisini hiç girmeden
      // ödeme sayfasını kapatsa bile sipariş personel tarafında "Alındı" görünürdü.
      const initialStatus =
        paymentStatus === PaymentStatus.PAID_ONLINE ? OrderStatus.PENDING_PAYMENT : OrderStatus.RECEIVED;

      const order = await tx.order.create({
        data: {
          customerId: userId,
          branchId,
          status: initialStatus,
          orderType,
          paymentStatus,
          subtotal,
          discountAmount,
          discountLabel,
          totalAmount,
          notes,
          items: {
            create: orderItemsToCreate,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // 4. Process loyalty points if user has a customer profile
      if (customerProfile) {
        // Loyalty logic: Earn 1 point for every 10 TL spent
        const pointsEarned = Math.floor(totalAmount / 10);
        const newPoints = customerProfile.loyaltyPoints + pointsEarned;
        const newTotalSpent = customerProfile.totalSpent + totalAmount;

        // Determine loyalty tier based on total spent
        let newTier = customerProfile.loyaltyTier;
        if (newTotalSpent >= 1500) {
          newTier = LoyaltyTier.GOLD;
        } else if (newTotalSpent >= 500) {
          newTier = LoyaltyTier.SILVER;
        }

        // Update profile
        await tx.customerProfile.update({
          where: { userId },
          data: {
            loyaltyPoints: newPoints,
            totalSpent: newTotalSpent,
            loyaltyTier: newTier,
          },
        });

        // Record loyalty transaction
        if (pointsEarned > 0) {
          await tx.loyaltyTransaction.create({
            data: {
              customerId: userId,
              orderId: order.id,
              pointsChange: pointsEarned,
              transactionType: 'earn',
            },
          });
        }
      }

      return order;
    });

    // Emit event after transaction commits successfully — pending_payment siparişler henüz
    // gerçek para akışı doğrulanmadığı için personele hiç bildirilmez (bkz. checkout()).
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      this.eventsGateway.emitNewOrder(order);
    }

    return order;
  }

  async findAllMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { customerId: userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, orderId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı');
    }

    // Security check: Customers can only view their own orders
    if (userRole === Role.CUSTOMER && order.customerId !== userId) {
      throw new UnauthorizedException('Bu siparişi görüntüleme yetkiniz yok');
    }

    return order;
  }

  // Fetch all active orders for Staff Kanban display — branch-scoped, personel yalnızca kendi
  // şubesinin siparişlerini görür.
  async findAllActiveOrders(branchId: string) {
    return this.prisma.order.findMany({
      where: {
        branchId,
        status: {
          notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.PENDING_PAYMENT],
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'asc' }, // Oldest orders first
    });
  }

  // Personel Kanban'ında "İptaller" bölümü için — son 24 saatte iptal edilmiş siparişler.
  // updatedAt her zaman son durum değişikliğini yansıttığından (iptal de bir durum değişikliği),
  // ayrı bir cancelledAt alanına gerek kalmadan doğru sıralama/filtreleme sağlar.
  async findRecentCancelled(branchId: string) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.order.findMany({
      where: {
        branchId,
        status: OrderStatus.CANCELLED,
        updatedAt: { gte: since },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
        payment: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Update order status and emit websocket event
  async updateStatus(orderId: string, status: OrderStatus, actingUserId: string, paymentMethod?: PaymentMethod) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı');
    }

    const currentStatus = order.status as OrderStatus;

    // Define valid transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      // pending_payment -> received geçişi yalnızca checkout() içinde (gerçek ödeme onayında)
      // yapılır, bu genel state machine üzerinden değil — burada sadece iptale izin verilir.
      [OrderStatus.PENDING_PAYMENT]: [OrderStatus.CANCELLED],
      [OrderStatus.RECEIVED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Geçersiz durum geçişi: ${currentStatus} -> ${status}`
      );
    }

    // Kasa (till) entegrasyonu: sipariş teslim edildiğinde gerçekten el değiştiren parayı
    // Z-Raporu'na yansıt. Kasada ödemede personel Nakit/Kart seçmek zorunda (kasada fiilen
    // ne tahsil edildiğini işaretlemenin tek yolu bu); online ödemede sadece kart üzerinden
    // tahsil edilen kısım (cüzdan düşümü hariç, zaten bakiye yüklenirken bir kez sayılmıştı).
    if (status === OrderStatus.DELIVERED) {
      if (order.paymentStatus === PaymentStatus.PAY_AT_COUNTER) {
        if (!paymentMethod) {
          throw new BadRequestException('Kasada ödeme alınan siparişlerde teslim anında ödeme yöntemi (Nakit/Kart) seçilmelidir.');
        }
        await this.recordTillEntry(order, actingUserId, paymentMethod, order.totalAmount);
      } else if (order.paymentStatus === PaymentStatus.PAID_ONLINE && order.payment && order.payment.amountCharged > 0) {
        await this.recordTillEntry(order, actingUserId, PaymentMethod.CARD, order.payment.amountCharged / 100);
      }
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // If order was cancelled, perform refunds and reversal
    if (status === OrderStatus.CANCELLED) {
      const payment = await this.prisma.payment.findUnique({
        where: { orderId },
      });

      if (payment && payment.status === 'SUCCESS') {
        const userId = order.customerId;

        try {
        await this.prisma.$transaction(async (tx) => {
          // 1. Mark payment as REFUNDED
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'REFUNDED' },
          });

          // Get fresh wallet
          let freshWallet = await tx.wallet.findUnique({ where: { userId } });
          if (!freshWallet) {
            freshWallet = await tx.wallet.create({ data: { userId, balance: 0 } });
          }

          let balance = freshWallet.balance;

          // 2. Refund walletAmountUsed (REFUND_CREDIT)
          if (payment.walletAmountUsed > 0) {
            balance += payment.walletAmountUsed;
            await tx.wallet.update({
              where: { id: freshWallet.id },
              data: { balance },
            });

            await tx.walletTransaction.create({
              data: {
                walletId: freshWallet.id,
                type: 'REFUND_CREDIT',
                amount: payment.walletAmountUsed,
                orderId,
                balanceAfter: balance,
                idempotencyKey: `refund_credit:${orderId}`,
              },
            });
          }

          // 3. Reversal of Cashback (CASHBACK_REVERSAL)
          const cashbackAmount = Math.floor(payment.amountCharged * 0.10);
          if (cashbackAmount > 0) {
            balance -= cashbackAmount;
            if (balance < 0) balance = 0;
            await tx.wallet.update({
              where: { id: freshWallet.id },
              data: { balance },
            });

            await tx.walletTransaction.create({
              data: {
                walletId: freshWallet.id,
                type: 'CASHBACK_REVERSAL',
                amount: cashbackAmount,
                orderId,
                balanceAfter: balance,
                idempotencyKey: `cashback_reversal:${orderId}`,
              },
            });
          }

          // 4. iyzico Refund if card was charged
          if (payment.amountCharged > 0 && payment.iyzicoPaymentId) {
            const isMock = !process.env.IYZICO_API_KEY || process.env.IYZICO_API_KEY === 'sandbox-xxxx';
            if (!isMock) {
              try {
                const Iyzipay = require('iyzipay');
                const iyzipay = new Iyzipay({
                  apiKey: process.env.IYZICO_API_KEY,
                  secretKey: process.env.IYZICO_SECRET_KEY,
                  uri: process.env.IYZICO_BASE_URL,
                });
                
                await new Promise((resolve) => {
                  iyzipay.refund.create({
                    locale: 'tr',
                    conversationId: `ref:${orderId}:${Date.now()}`,
                    paymentTransactionId: payment.iyzicoPaymentId,
                    price: (payment.amountCharged / 100).toFixed(2),
                    currency: 'TRY',
                    ip: '127.0.0.1'
                  }, (err: any, result: any) => {
                    resolve(result);
                  });
                });
              } catch (e) {
                console.error('iyzico refund failed:', e);
              }
            }
          }
        });
        } catch (e: any) {
          // Concurrent cancellation of the same paid order can race here: the deterministic
          // idempotencyKey (refund_credit:/cashback_reversal:<orderId>) uniqueness guard rejects
          // the second attempt with P2002 instead of double-refunding. Surface that as a clean
          // 400 rather than letting a raw Prisma error bubble up as an unhandled 500.
          if (e.code === 'P2002') {
            throw new BadRequestException('Bu sipariş için iade işlemi zaten gerçekleştirilmiş.');
          }
          throw e;
        }
      }
    }

    // Emit status change notification
    this.eventsGateway.emitStatusUpdate(orderId, status, order.branchId);

    return updatedOrder;
  }

  async checkout(userId: string, orderId: string, body: CheckoutOrderDto) {
    const { useWallet, walletAmount, paymentToken } = body;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı');
    }

    if (order.customerId !== userId) {
      throw new UnauthorizedException('Bu sipariş için ödeme yapamazsınız');
    }

    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Bu sipariş zaten tamamlanmış veya iptal edilmiş');
    }

    if (order.payment && order.payment.status === 'SUCCESS') {
      throw new BadRequestException('Bu sipariş için zaten başarılı bir ödeme yapılmış');
    }

    const totalKurus = Math.round(order.totalAmount * 100);

    // Get user wallet
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId, balance: 0 },
      });
    }

    let walletAmountUsed = 0;
    if (useWallet) {
      const requestedWalletAmount = walletAmount ? Math.round(walletAmount * 100) : wallet.balance;
      walletAmountUsed = Math.min(requestedWalletAmount, wallet.balance, totalKurus);
      if (walletAmountUsed < 0) walletAmountUsed = 0;
    }

    const remainingKurus = totalKurus - walletAmountUsed;

    const conversationId = `conv:${orderId}:${Date.now()}`;

    // A. Remaining Kurus === 0 (Full Wallet Payment)
    if (remainingKurus === 0) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          // Double check wallet balance inside transaction
          const freshWallet = await tx.wallet.findUnique({ where: { userId } });
        if (!freshWallet || freshWallet.balance < walletAmountUsed) {
          throw new BadRequestException('Yetersiz cüzdan bakiyesi');
        }

        // Update wallet balance
        const balanceAfter = freshWallet.balance - walletAmountUsed;
        await tx.wallet.update({
          where: { id: freshWallet.id },
          data: { balance: balanceAfter },
        });

        // Create PAYMENT_DEBIT transaction
        await tx.walletTransaction.create({
          data: {
            walletId: freshWallet.id,
            type: 'PAYMENT_DEBIT',
            amount: walletAmountUsed,
            orderId,
            balanceAfter,
            idempotencyKey: `payment_debit:${orderId}`,
          },
        });

          // Create/Update Payment record as SUCCESS immediately since no card is used
          const payment = await tx.payment.upsert({
            where: { orderId },
            create: {
              orderId,
              status: 'SUCCESS',
              amountCharged: 0,
              walletAmountUsed,
              iyzicoConversationId: conversationId,
            },
            update: {
              status: 'SUCCESS',
              amountCharged: 0,
              walletAmountUsed,
              iyzicoConversationId: conversationId,
            },
          });

        // Update Order status — ödeme onaylandığı an "pending_payment"tan çıkıp personel
        // Kanban'ında görünür hale gelir (bkz. create()/findAllActiveOrders).
        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'paid_online', status: OrderStatus.RECEIVED },
        });

        return {
          status: 'success',
          paymentId: payment.id,
          amountCharged: 0,
          walletAmountUsed,
          cashbackEarned: 0,
        };
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException('Bu sipariş ödemesi zaten işlendi.');
      }
      throw e;
    } finally {
      await this.notifyOrderPaidIfReceived(orderId);
    }
    }

    // B. Remaining Kurus > 0 (Cards or Karma Payment)
    if (!paymentToken) {
      throw new BadRequestException('Ödeme işlemi için kart token\'ı gereklidir.');
    }

    // P0-3 Fix: paymentToken, initializeCheckoutForm ile ilklendirilip DB'ye yazılan aktif
    // ödeme oturumuyla (Payment.iyzicoConversationId) eşleşmek zorunda. Bu kontrol olmadan
    // sipariş için hiç initialize çağrılmamış olsa da veya eski/rastgele bir "mock-token-*"
    // string'i gönderilerek ödeme tamamlanabiliyordu (eski token geçersizleştirilmiyordu).
    if (!order.payment || order.payment.status !== 'PENDING' || order.payment.iyzicoConversationId !== paymentToken) {
      throw new BadRequestException('Geçersiz veya süresi dolmuş ödeme token\'ı. Lütfen ödeme formunu yeniden başlatın.');
    }

    let iyzicoResult: any;
    const isMock = !process.env.IYZICO_API_KEY ||
                   process.env.IYZICO_API_KEY === 'sandbox-xxxx' ||
                   (paymentToken && paymentToken.startsWith('mock-token'));

    if (isMock) {
      // Simulate iyzico response
      if (paymentToken && paymentToken.startsWith('mock-token')) {
        iyzicoResult = {
          status: 'success',
          paymentStatus: 'SUCCESS',
          paymentId: 'mock-iyz-' + paymentToken,
          paidPrice: (remainingKurus / 100).toFixed(2),
        };
      } else {
        iyzicoResult = {
          status: 'failure',
          errorMessage: 'Geçersiz test ödeme token\'ı.',
        };
      }
    } else {
      // Real iyzico sandbox API call
      try {
        const Iyzipay = require('iyzipay');
        const iyzipay = new Iyzipay({
          apiKey: process.env.IYZICO_API_KEY,
          secretKey: process.env.IYZICO_SECRET_KEY,
          uri: process.env.IYZICO_BASE_URL,
        });

        iyzicoResult = await new Promise((resolve) => {
          iyzipay.checkoutForm.retrieve({
            locale: 'tr',
            token: paymentToken,
          }, (err: any, result: any) => {
            if (err) resolve({ status: 'failure', errorMessage: err.message });
            else resolve(result);
          });
        });
      } catch (err: any) {
        iyzicoResult = { status: 'failure', errorMessage: err.message };
      }
    }

    if (iyzicoResult.status !== 'success' || iyzicoResult.paymentStatus !== 'SUCCESS') {
      throw new BadRequestException(iyzicoResult.errorMessage || 'Ödeme işlemi onaylanamadı veya başarısız oldu');
    }

    // Verify paid amount matches expected remaining amount to prevent parameter tampering
    const iyzicoPaidAmountKurus = Math.round(parseFloat(iyzicoResult.paidPrice) * 100);
    if (Math.abs(iyzicoPaidAmountKurus - remainingKurus) > 2) {
      throw new BadRequestException('Ödeme tutarı uyuşmuyor.');
    }

    // Payment Successful! Apply Debit, Cashback, and update DB inside transaction
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Double check wallet balance for debit
        const freshWallet = await tx.wallet.findUnique({ where: { userId } });
      if (!freshWallet || (useWallet && freshWallet.balance < walletAmountUsed)) {
        throw new BadRequestException('Yetersiz cüzdan bakiyesi (karma ödeme doğrulaması)');
      }

      let balance = freshWallet.balance;

      // 2. Perform Wallet Debit if used
      if (walletAmountUsed > 0) {
        balance -= walletAmountUsed;
        await tx.wallet.update({
          where: { id: freshWallet.id },
          data: { balance },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: freshWallet.id,
            type: 'PAYMENT_DEBIT',
            amount: walletAmountUsed,
            orderId,
            balanceAfter: balance,
            idempotencyKey: `payment_debit:${orderId}`,
          },
        });
      }

      // 3. Perform Cashback Credit (only on amountCharged!)
      const cashbackAmount = Math.floor(remainingKurus * 0.10);
      if (cashbackAmount > 0) {
        balance += cashbackAmount;
        await tx.wallet.update({
          where: { id: freshWallet.id },
          data: { balance },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: freshWallet.id,
            type: 'CASHBACK',
            amount: cashbackAmount,
            orderId,
            balanceAfter: balance,
            idempotencyKey: `cashback:${orderId}`,
          },
        });
      }

      // 4. Update existing Payment Record to SUCCESS
      const payment = await tx.payment.upsert({
        where: { orderId },
        create: {
          orderId,
          status: 'SUCCESS',
          amountCharged: remainingKurus,
          walletAmountUsed,
          iyzicoPaymentId: iyzicoResult.paymentId || 'iyz-' + Date.now(),
          iyzicoConversationId: conversationId,
          rawResponse: JSON.stringify(iyzicoResult),
        },
        update: {
          status: 'SUCCESS',
          iyzicoPaymentId: iyzicoResult.paymentId || 'iyz-' + Date.now(),
          rawResponse: JSON.stringify(iyzicoResult),
        },
      });

      // 5. Update Order status — ödeme onaylandığı an "pending_payment"tan çıkıp personel
      // Kanban'ında görünür hale gelir (bkz. create()/findAllActiveOrders).
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'paid_online', status: OrderStatus.RECEIVED },
      });

      return {
        status: 'success',
        paymentId: payment.id,
        amountCharged: remainingKurus,
        walletAmountUsed,
        cashbackEarned: cashbackAmount,
      };
    });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException('Bu sipariş ödemesi zaten işlendi.');
      }
      throw e;
    } finally {
      await this.notifyOrderPaidIfReceived(orderId);
    }
  }

  // checkout() içindeki her iki başarı yolundan sonra çağrılır: sipariş gerçekten
  // "received" durumuna geçtiyse (pending_payment'tan çıktıysa) personele canlı bildirir.
  // Transaction dışında çalışır ki commit kesinleşmeden socket olayı gönderilmesin.
  private async notifyOrderPaidIfReceived(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        customer: { select: { fullName: true, email: true, phone: true } },
      },
    });
    if (order && order.status === OrderStatus.RECEIVED) {
      this.eventsGateway.emitNewOrder(order);
    }
  }

  async initializeCheckoutForm(userId: string, orderId: string, useWallet: boolean, walletAmount?: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı');
    }

    if (order.customerId !== userId) {
      throw new UnauthorizedException('Bu sipariş için işlem yapamazsınız');
    }

    const totalKurus = Math.round(order.totalAmount * 100);
    let walletAmountUsed = 0;

    if (useWallet) {
      const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
      const walletBalance = wallet?.balance || 0;
      const requestedWalletAmount = walletAmount ? Math.round(walletAmount * 100) : walletBalance;
      walletAmountUsed = Math.min(walletBalance, totalKurus, requestedWalletAmount);
    }

    const remainingKurus = totalKurus - walletAmountUsed;

    if (remainingKurus <= 0) {
      throw new BadRequestException('Sipariş tutarının tamamı cüzdan ile ödenebilir, kart ödemesine gerek yok.');
    }

    // Create or update existing Payment record to PENDING first
    const conversationId = 'init-' + orderId + '-' + Date.now();
    await this.prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        status: 'PENDING',
        amountCharged: remainingKurus,
        walletAmountUsed,
        iyzicoConversationId: conversationId,
      },
      update: {
        status: 'PENDING',
        amountCharged: remainingKurus,
        walletAmountUsed,
        iyzicoConversationId: conversationId,
      },
    });

    const isMock = !process.env.IYZICO_API_KEY || process.env.IYZICO_API_KEY === 'sandbox-xxxx';

    if (isMock) {
      const mockToken = 'mock-token-' + orderId + '-' + Date.now();
      await this.prisma.payment.update({
        where: { orderId },
        data: { iyzicoConversationId: mockToken },
      });
      return {
        status: 'success',
        token: mockToken,
        checkoutFormContent: '<p>Mock payment form</p>',
        paymentPageUrl: `http://localhost:4000/orders/checkout-form/success?token=${mockToken}`,
      };
    }

    const userObj = await this.prisma.user.findUnique({ where: { id: userId } });
    const Iyzipay = require('iyzipay');
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      uri: process.env.IYZICO_BASE_URL,
    });

    const iyzicoRequest = {
      locale: 'tr',
      conversationId: 'init-' + orderId + '-' + Date.now(),
      price: (totalKurus / 100).toFixed(2),
      paidPrice: (remainingKurus / 100).toFixed(2),
      currency: 'TRY',
      installment: '1',
      basketId: orderId,
      paymentGroup: 'PRODUCT',
      callbackUrl: 'http://localhost:4000/orders/checkout-form/callback',
      buyer: {
        id: userId,
        name: userObj?.fullName.split(' ')[0] || 'Kalla',
        surname: userObj?.fullName.split(' ')[1] || 'Customer',
        gsmNumber: userObj?.phone || '+905554443322',
        email: userObj?.email || 'customer@kalla.com',
        identityNumber: '11111111111',
        registrationAddress: 'Kalla Roastery',
        ip: '127.0.0.1',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34000',
      },
      shippingAddress: {
        contactName: userObj?.fullName || 'Kalla Customer',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Kalla Roastery',
        zipCode: '34000',
      },
      billingAddress: {
        contactName: userObj?.fullName || 'Kalla Customer',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Kalla Roastery',
        zipCode: '34000',
      },
      basketItems: order.items.map((item) => ({
        id: item.id,
        name: item.product.name,
        category1: 'Beverage',
        itemType: 'PHYSICAL',
        price: (item.unitPrice * item.quantity).toFixed(2),
      })),
    };

    return new Promise((resolve, reject) => {
      iyzipay.checkoutFormInitialize.create(iyzicoRequest, async (err: any, result: any) => {
        if (err) {
          reject(new BadRequestException(err.message));
        } else {
          if (result.status === 'success' && result.token) {
            await this.prisma.payment.update({
              where: { orderId },
              data: { iyzicoConversationId: result.token },
            });
          }
          resolve(result);
        }
      });
    });
  }

  // BUG-1 Fix: Sipariş iptali — /orders/:id/cancel endpoint için servis metodu
  async cancelOrder(userId: string, orderId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı');
    }

    // Yetki kontrolü: müşteri yalnızca kendi siparişini iptal edebilir
    if (userRole !== Role.ADMIN && userRole !== Role.STAFF && userRole !== Role.SHIFT_LEAD) {
      if (order.customerId !== userId) {
        throw new UnauthorizedException('Bu siparişi iptal etme yetkiniz yok');
      }
    }

    // Zaten iptal edilmiş veya teslim edilmiş siparişler tekrar iptal edilemez
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Bu sipariş zaten iptal edilmiş');
    }
    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Teslim edilmiş sipariş iptal edilemez');
    }

    // Var olan updateStatus metodu üzerinden iptali gerçekleştir (iade/reversal mantığı orada)
    return this.updateStatus(orderId, OrderStatus.CANCELLED, userId);
  }

  // Sipariş "Teslim Et" durumuna geçtiğinde kasaya tek bir PosSale satırı yazar. orderId üzerindeki
  // benzersizlik kısıtı (@unique), aynı sipariş için birden fazla kasa kaydı oluşmasını engeller.
  private async recordTillEntry(order: { id: string; branchId: string }, soldById: string, paymentMethod: PaymentMethod, amount: number) {
    try {
      await this.prisma.posSale.create({
        data: {
          orderId: order.id,
          branchId: order.branchId,
          description: `Sipariş #${order.id.slice(0, 8).toUpperCase()}`,
          unitPrice: amount,
          quantity: 1,
          paymentMethod,
          soldById,
        },
      });
    } catch (e: any) {
      if (e.code !== 'P2002') {
        throw e;
      }
      // Bu sipariş için kasa kaydı zaten var — normal geçiş kurallarıyla erişilemez ama
      // yine de sessizce yut (idempotency guard).
    }
  }
}
