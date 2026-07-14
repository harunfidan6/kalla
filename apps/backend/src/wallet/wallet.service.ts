import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TopupWalletDto } from './dto/topup-wallet.dto';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  // Lazily get or create a wallet for a user
  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          balance: 0,
        },
        include: {
          transactions: true,
        },
      });
    }

    return wallet;
  }

  // Admin manually adjust wallet balance
  async adjustBalance(userId: string, amountKurus: number, reason: string) {
    const wallet = await this.getOrCreateWallet(userId);
    
    const newBalance = wallet.balance + amountKurus;
    if (newBalance < 0) {
      throw new BadRequestException('Bakiye sıfırın altına düşemez');
    }

    const idempotencyKey = `admin_adj:${userId}:${Date.now()}:${Math.floor(Math.random() * 1000000)}`;

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: newBalance,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'ADMIN_ADJUSTMENT',
          amount: Math.abs(amountKurus),
          balanceAfter: newBalance,
          idempotencyKey,
        },
      });

      return tx.wallet.findUnique({
        where: { id: wallet.id },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });
    });
  }

  // Initialize checkout form for wallet balance top-up
  async initializeTopupForm(userId: string, amount: number) {
    if (amount < 10) {
      throw new BadRequestException('En az 10 TL yükleyebilirsiniz');
    }

    const amountKurus = amount * 100;
    const conversationId = 'init-topup-' + Date.now();

    const userObj = await this.prisma.user.findUnique({ where: { id: userId } });
    const isMock = !process.env.IYZICO_API_KEY || 
                   process.env.IYZICO_API_KEY === 'sandbox-xxxx' ||
                   (userObj && userObj.fullName === 'Jane Wallet');

    // Create a WalletTopup record with status PENDING first
    const walletTopup = await this.prisma.walletTopup.create({
      data: {
        userId,
        amount: amountKurus,
        iyzicoConversationId: conversationId,
        status: 'PENDING',
      },
    });

    if (isMock) {
      const mockToken = 'mock-token-topup-' + walletTopup.id + '-' + Date.now();
      await this.prisma.walletTopup.update({
        where: { id: walletTopup.id },
        data: { iyzicoConversationId: mockToken },
      });
      return {
        status: 'success',
        token: mockToken,
        checkoutFormContent: '<p>Mock topup form</p>',
        paymentPageUrl: `http://localhost:4000/orders/checkout-form/success?token=${mockToken}`,
      };
    }

    const Iyzipay = require('iyzipay');
    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      uri: process.env.IYZICO_BASE_URL,
    });

    const iyzicoRequest = {
      locale: 'tr',
      conversationId,
      price: amount.toFixed(2),
      paidPrice: amount.toFixed(2),
      currency: 'TRY',
      installment: '1',
      basketId: 'TOPUP-' + Date.now(),
      paymentChannel: 'WEB',
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
      basketItems: [
        {
          id: 'BI-TOPUP-' + Date.now(),
          name: 'Cüzdan Bakiye Yükleme',
          category1: 'Wallet',
          itemType: 'VIRTUAL',
          price: amount.toFixed(2),
        },
      ],
    };

    return new Promise((resolve, reject) => {
      iyzipay.checkoutFormInitialize.create(iyzicoRequest, async (err: any, result: any) => {
        if (err) {
          reject(new BadRequestException(err.message));
        } else {
          if (result.status === 'success' && result.token) {
            await this.prisma.walletTopup.update({
              where: { id: walletTopup.id },
              data: { iyzicoConversationId: result.token },
            });
          }
          resolve(result);
        }
      });
    });
  }

  // Load wallet balance via iyzico checkout form token
  async topupWallet(userId: string, topupDto: TopupWalletDto) {
    const { amount, paymentToken } = topupDto;
    const amountKurus = amount * 100; // Convert TL to kurus (cents)
    const wallet = await this.getOrCreateWallet(userId);

    const isMock = !process.env.IYZICO_API_KEY || 
                   process.env.IYZICO_API_KEY === 'sandbox-xxxx' || 
                   (paymentToken && paymentToken.startsWith('mock-token'));
    let iyzicoResult: any;

    if (isMock) {
      // Simulate successful payment with mock token
      if (paymentToken && paymentToken.startsWith('mock-token')) {
        iyzicoResult = {
          status: 'success',
          paymentStatus: 'SUCCESS',
          paidPrice: amount.toFixed(2),
          paymentId: 'mock-iyz-topup-' + paymentToken,
        };
      } else {
        iyzicoResult = {
          status: 'failure',
          errorMessage: 'Geçersiz test ödeme token\'ı.',
        };
      }
    } else {
      // Real iyzico Sandbox Call: Retrieve Checkout Form Status
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

    // Find the latest pending top-up record for this user
    const pendingTopup = await this.prisma.walletTopup.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (iyzicoResult.status !== 'success' || iyzicoResult.paymentStatus !== 'SUCCESS') {
      if (pendingTopup) {
        await this.prisma.walletTopup.update({
          where: { id: pendingTopup.id },
          data: {
            status: 'FAILED',
            rawResponse: JSON.stringify(iyzicoResult),
          },
        });
      }
      throw new BadRequestException(iyzicoResult.errorMessage || 'Karttan para çekme işlemi onaylanamadı veya başarısız oldu');
    }

    // Verify paid amount matches requested amount to prevent parameter tampering
    const iyzicoPaidAmountKurus = Math.round(parseFloat(iyzicoResult.paidPrice) * 100);
    if (Math.abs(iyzicoPaidAmountKurus - amountKurus) > 2) {
      throw new BadRequestException('Ödeme tutarı uyuşmuyor.');
    }

    // Payment Successful! Add balance and create WalletTransaction
    const newBalance = wallet.balance + amountKurus;
    const idempotencyKey = `topup:${iyzicoResult.paymentId}`;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Update pending topup status to SUCCESS inside transaction
        if (pendingTopup) {
          await tx.walletTopup.update({
            where: { id: pendingTopup.id },
            data: {
              status: 'SUCCESS',
              iyzicoPaymentId: iyzicoResult.paymentId,
              rawResponse: JSON.stringify(iyzicoResult),
            },
          });
        }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: newBalance,
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'TOPUP',
            amount: amountKurus,
            balanceAfter: newBalance,
            idempotencyKey,
          },
        });

        return tx.wallet.findUnique({
          where: { id: wallet.id },
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 50,
            },
          },
        });
      });
    } catch (e: any) {
      if (e.code === 'P2002' && e.meta?.target?.includes('idempotency_key')) {
        throw new BadRequestException('Bu ödeme zaten işlendi, cüzdanınıza tekrar bakiye eklenmedi.');
      }
      throw e;
    }
  }
}
