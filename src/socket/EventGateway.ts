import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import { NotificationEvent } from 'src/constants/event';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private configService: ConfigService) {}
  @WebSocketServer()
  server: Server;

  async handleConnection(socket: Socket) {
    const token = socket.handshake.auth?.token;
    // console.log('check token::', token);
    const jwtSecret = this.configService.get(
      ENTITIES_MESSAGE.JWT_ACCESS_TOKEN_KEY,
    );
    if (!token) {
      socket.disconnect();
      return;
    }
    try {
      const payload = jwt.verify(token, jwtSecret);
      console.log('Client connected with ID:', socket.id);
    } catch (err) {
      console.log(' Invalid token, disconnecting socket');
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    console.log(`Disconnected`);
    console.log('Client disconnected:', socket.id);
  }

  notifyToAllClients(message: any) {
    this.server.emit(NotificationEvent.NOTIFICATION, { message });
  }
}
