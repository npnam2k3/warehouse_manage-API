import { Module } from '@nestjs/common';
import { EventsGateway } from './EventGateway';

@Module({
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class SocketModule {}
