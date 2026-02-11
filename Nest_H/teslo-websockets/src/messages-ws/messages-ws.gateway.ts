
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer} from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadInterface } from 'src/auth/interfaces/jwt-payload.interface';


@WebSocketGateway({cors: true})
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect{

  @WebSocketServer() wss: Server
  
 constructor(
  private readonly messagesWsService: MessagesWsService,
  private readonly jwtService: JwtService
) {}
  
async handleConnection(client: Socket) {
  const token = client.handshake.headers.authentication as string
  
  let payload : JwtPayloadInterface = {id: ''}

  try {
    payload = this.jwtService.verify(token)
    
    await this.messagesWsService.registerClient(client, payload.id) 
    
  } catch (error) {
    client.disconnect()
  }
  


  this.wss.emit('clients-updated',this.messagesWsService.getConnectedClients() )
}
  
 handleDisconnect(client: Socket) {
    this.messagesWsService.removeClient(client.id)

    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients())
  }

  @SubscribeMessage('message-from-client')
  onMessageFromClient(client: Socket, payload: NewMessageDto){
  
    //Mensaje a todos incluyendo al que emitió el mensaje
    this.wss.emit('message-from-server', {
      fullName: this.messagesWsService.getUserFullNameBySocketId(client.id),
      message: payload.message || 'no hay mensaje'
    })
  }
}