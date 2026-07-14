import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ReconciliationService } from './reconciliation.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, ReconciliationService],
  exports: [OrdersService],
})
export class OrdersModule {}
