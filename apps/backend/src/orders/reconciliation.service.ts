import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@kafe/shared-types';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private prisma: PrismaService) {}

  // Run reconciliation every 5 minutes
  @Cron('*/5 * * * *')
  async reconcilePendingPayments() {
    this.logger.log('Starting periodic payment reconciliation cron job...');

    const thresholdTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

    try {
      // 1. Process Pending Order Payments
      const pendingPayments = await this.prisma.payment.findMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: thresholdTime },
        },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
        },
      });

      this.logger.log(`Found ${pendingPayments.length} pending order payments to reconcile.`);

      for (const payment of pendingPayments) {
        await this.reconcileOrderPayment(payment);
      }

      // 2. Process Pending Wallet Top-ups
      const pendingTopups = await this.prisma.walletTopup.findMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: thresholdTime },
        },
      });

      this.logger.log(`Found ${pendingTopups.length} pending wallet top-ups to reconcile.`);

      for (const topup of pendingTopups) {
        await this.reconcileWalletTopup(topup);
      }

    } catch (err: any) {
      this.logger.error('Error during payment reconciliation job:', err.stack);
    }
  }

  private async reconcileOrderPayment(payment: any) {
    const { orderId, iyzicoConversationId, amountCharged, walletAmountUsed } = payment;
    this.logger.log(`Reconciling payment for Order: ${orderId} | Token: ${iyzicoConversationId}`);

    const isMock = !process.env.IYZICO_API_KEY || 
                   process.env.IYZICO_API_KEY === 'sandbox-xxxx' || 
                   iyzicoConversationId.startsWith('mock-token');

    let iyzicoResult: any;

    if (isMock) {
      // Simulate checking: if it is a mock token, we assume mock failed or we can check status.
      // Usually, if a mock token is abandoned for 5 minutes, we mark it as FAILED.
      iyzicoResult = { status: 'failure', errorMessage: 'Mock payment session expired' };
    } else {
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
            token: iyzicoConversationId,
          }, (err: any, result: any) => {
            if (err) resolve({ status: 'failure', errorMessage: err.message });
            else resolve(result);
          });
        });
      } catch (err: any) {
        iyzicoResult = { status: 'failure', errorMessage: err.message };
      }
    }

    if (iyzicoResult.status === 'success' && iyzicoResult.paymentStatus === 'SUCCESS') {
      // Payment was actually completed! Resolve it in our database
      this.logger.log(`Success found at iyzico for Order: ${orderId}! Applying success updates...`);
      
      const remainingKurus = amountCharged;
      const totalKurus = remainingKurus + walletAmountUsed;
      const userId = payment.order.customerId;

      try {
        await this.prisma.$transaction(async (tx) => {
          // Double check wallet balance for debit portion
          let wallet = await tx.wallet.findUnique({ where: { userId } });
          if (!wallet) {
            wallet = await tx.wallet.create({ data: { userId, balance: 0 } });
          }
          const balance = wallet.balance;

          if (walletAmountUsed > 0 && balance < walletAmountUsed) {
            throw new Error('Insufficient wallet balance for reconciliation karma payment');
          }

          let newBalance = balance;

          // 1. Perform Wallet Debit if used
          if (walletAmountUsed > 0) {
            newBalance -= walletAmountUsed;
            await tx.wallet.update({
              where: { id: wallet.id },
              data: { balance: newBalance },
            });

            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                type: 'PAYMENT_DEBIT',
                amount: walletAmountUsed,
                orderId,
                balanceAfter: newBalance,
                idempotencyKey: `payment_debit:${orderId}`,
              },
            });
          }

          // 2. Perform Cashback Credit (only on amountCharged!)
          const cashbackAmount = Math.floor(remainingKurus * 0.10);
          if (cashbackAmount > 0) {
            newBalance += cashbackAmount;
            await tx.wallet.update({
              where: { id: wallet.id },
              data: { balance: newBalance },
            });

            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                type: 'CASHBACK',
                amount: cashbackAmount,
                orderId,
                balanceAfter: newBalance,
                idempotencyKey: `cashback:${orderId}`,
              },
            });
          }

          // 3. Mark payment as SUCCESS
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCESS',
              iyzicoPaymentId: iyzicoResult.paymentId || 'iyz-rec-' + Date.now(),
              rawResponse: JSON.stringify(iyzicoResult),
            },
          });

          // 4. Update Order status
          await tx.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'paid_online' },
          });
        });

        this.logger.log(`Successfully reconciled Order: ${orderId} as SUCCESS.`);
      } catch (err: any) {
        this.logger.error(`Failed to apply reconciliation transaction updates for Order: ${orderId}: ${err.message}`);
      }
    } else {
      // Payment did not complete successfully or expired, transition to FAILED
      this.logger.log(`Payment failed or was not completed for Order: ${orderId}. Setting status to FAILED.`);
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          rawResponse: JSON.stringify(iyzicoResult),
        },
      });
    }
  }

  private async reconcileWalletTopup(topup: any) {
    const { id, userId, amount, iyzicoConversationId } = topup;
    this.logger.log(`Reconciling wallet top-up: ${id} | Token: ${iyzicoConversationId}`);

    const isMock = !process.env.IYZICO_API_KEY || 
                   process.env.IYZICO_API_KEY === 'sandbox-xxxx' || 
                   iyzicoConversationId.startsWith('mock-token');

    let iyzicoResult: any;

    if (isMock) {
      iyzicoResult = { status: 'failure', errorMessage: 'Mock top-up session expired' };
    } else {
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
            token: iyzicoConversationId,
          }, (err: any, result: any) => {
            if (err) resolve({ status: 'failure', errorMessage: err.message });
            else resolve(result);
          });
        });
      } catch (err: any) {
        iyzicoResult = { status: 'failure', errorMessage: err.message };
      }
    }

    if (iyzicoResult.status === 'success' && iyzicoResult.paymentStatus === 'SUCCESS') {
      this.logger.log(`Success found at iyzico for top-up: ${id}! Crediting wallet...`);
      
      try {
        await this.prisma.$transaction(async (tx) => {
          const wallet = await tx.wallet.findUnique({ where: { userId } });
          if (!wallet) throw new Error(`Wallet not found for User: ${userId}`);

          const walletId = wallet.id;
          const newBalance = wallet.balance + amount;

          // P0-2 Fix: idempotency key artık Date.now() içermiyor — sadece paymentId'e bağlı deterministik key
          const idempotencyKey = `topup:${iyzicoResult.paymentId}`;

          // Update wallet topup status
          await tx.walletTopup.update({
            where: { id },
            data: {
              status: 'SUCCESS',
              iyzicoPaymentId: iyzicoResult.paymentId,
              rawResponse: JSON.stringify(iyzicoResult),
            },
          });

          // Credit balance
          await tx.wallet.update({
            where: { id: walletId },
            data: { balance: newBalance },
          });

          // Create transaction record — P2002 unique constraint ile çift bakiye eklenmesi engelleniyor
          try {
            await tx.walletTransaction.create({
              data: {
                walletId: walletId,
                type: 'TOPUP',
                amount: amount,
                balanceAfter: newBalance,
                idempotencyKey,
              },
            });
          } catch (e: any) {
            if (e.code === 'P2002' && e.meta?.target?.includes('idempotency_key')) {
              this.logger.warn(`Topup ${id} zaten reconcile edilmiş, idempotency key çakışması — atlanıyor.`);
              // Transaction'ı rollback et (bakiye kredi verilmemeli)
              throw e;
            }
            throw e;
          }
        });

        this.logger.log(`Successfully reconciled wallet top-up: ${id} as SUCCESS.`);
      } catch (err: any) {
        this.logger.error(`Failed to apply reconciliation top-up updates for: ${id}: ${err.message}`);
      }
    } else {
      this.logger.log(`Top-up failed or was not completed for session: ${id}. Setting status to FAILED.`);
      await this.prisma.walletTopup.update({
        where: { id },
        data: {
          status: 'FAILED',
          rawResponse: JSON.stringify(iyzicoResult),
        },
      });
    }
  }
}
