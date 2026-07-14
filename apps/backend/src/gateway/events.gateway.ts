import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { Role } from '@kafe/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { getAllowedOrigins } from '../common/allowed-origins';

@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = getAllowedOrigins();
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    let token = client.handshake.auth?.token || client.handshake.query?.token;
    if (Array.isArray(token)) token = token[0];

    if (!token) {
      this.logger.warn(`Client connection rejected: No token provided (${client.id})`);
      client.disconnect();
      return;
    }

    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      (client as any).user = payload;

      if (
        payload.role === Role.STAFF ||
        payload.role === Role.SHIFT_LEAD ||
        payload.role === Role.ADMIN
      ) {
        // Şube bazlı oda: personel yalnızca kendi şubesinin sipariş olaylarını almalı. Şube
        // ataması olmayan personel (ör. Admin) hiçbir odaya katılmaz — canlı sipariş yayını almaz.
        if (payload.branchId) {
          client.join(`staff:${payload.branchId}`);
          this.logger.log(`Staff client connected: ${client.id} (${payload.email}, branch ${payload.branchId})`);
        } else {
          this.logger.log(`Staff client connected without a branch assignment: ${client.id} (${payload.email})`);
        }
      } else {
        this.logger.log(`Customer client connected: ${client.id} (${payload.email})`);
      }
    } catch (err) {
      this.logger.warn(`Client connection rejected: Invalid token (${client.id})`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Helper method to emit new order notifications only to that order's branch room
  emitNewOrder(order: any) {
    this.logger.log(`Broadcasting order:new to branch ${order.branchId} for order ${order.id}`);
    this.server.to(`staff:${order.branchId}`).emit('order:new', order);
  }

  // Helper method to emit status update notifications to the order's branch and the specific order room
  emitStatusUpdate(orderId: string, status: string, branchId: string) {
    this.logger.log(`Broadcasting order:status_update for order ${orderId} -> ${status} (branch ${branchId})`);
    // Notify staff of that branch only
    this.server.to(`staff:${branchId}`).emit('order:status_update', { orderId, status });
    // Notify specific order subscriber (customer)
    this.server.to(`order_${orderId}`).emit('order:status_update', { orderId, status });
  }

  // Customers subscribe to their specific order status updates.
  // Ownership is verified so a customer cannot listen in on another customer's order updates
  // (staff/shift_lead/admin already receive their branch's updates via the staff:<branchId> room
  // and may subscribe to any individual order freely).
  @SubscribeMessage('subscribeToOrder')
  async handleSubscribeToOrder(client: Socket, data: any) {
    const user = (client as any).user as JwtPayload | undefined;
    if (!user) {
      return { status: 'error', message: 'Unauthorized' };
    }
    const orderId = typeof data === 'string' ? data : data?.orderId;
    if (!orderId) {
      return { status: 'error', message: 'Invalid orderId' };
    }

    const isStaff = user.role === Role.STAFF || user.role === Role.SHIFT_LEAD || user.role === Role.ADMIN;
    if (!isStaff) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { customerId: true },
      });
      if (!order || order.customerId !== user.sub) {
        this.logger.warn(`Client ${client.id} (${user.email}) denied subscription to order_${orderId} (not owner)`);
        return { status: 'error', message: 'Unauthorized' };
      }
    }

    client.join(`order_${orderId}`);
    this.logger.log(`Client ${client.id} subscribed to order_${orderId}`);
    return { status: 'success' };
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket, data: any): string {
    return 'pong';
  }
}
