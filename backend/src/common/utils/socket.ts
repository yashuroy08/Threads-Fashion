import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer;

export const initSocket = (server: HTTPServer) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: '*', // Adjust for production
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

// Event emitters
export const emitOrderUpdate = (order: any) => {
    try {
        getIO().emit('order_update', order);
    } catch (error) {
        console.error('Socket emission failed (emitOrderUpdate):', error);
    }
};

export const emitProductStatus = (productId: string, isActive: boolean) => {
    try {
        getIO().emit('product_status_change', { productId, isActive });
    } catch (error) {
        console.error('Socket emission failed (emitProductStatus):', error);
    }
};
