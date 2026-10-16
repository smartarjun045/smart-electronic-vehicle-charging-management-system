import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/tokens';
import { env } from '../config/env';
import { attachSocketServer } from '../services/chargingSimulatorService';

/**
 * Socket.IO authenticates connections via a JWT passed in the handshake
 * (auth.token), then joins the socket to a private `user:<id>` room so
 * events are only ever emitted to the user who owns that booking/session —
 * this is also how the admin dashboard subscribes to the `admin` room.
 */
export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(); // allow anonymous connections for public station-status updates
    try {
      const payload = verifyAccessToken(token);
      (socket as any).user = payload;
      next();
    } catch {
      next(); // invalid token: treat as anonymous rather than hard-fail the socket
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as { userId: string; role: string } | undefined;
    if (user) {
      socket.join(`user:${user.userId}`);
      if (user.role === 'ADMIN') socket.join('admin');
    }

    socket.on('disconnect', () => {
      // no-op: room membership is cleaned up automatically by Socket.IO
    });
  });

  attachSocketServer(io);
  return io;
}
