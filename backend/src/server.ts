import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { initSocket } from './common/utils/socket';


const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI as string;

const httpServer = createServer(app);
initSocket(httpServer);

const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected');

        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server', error);
        process.exit(1);
    }
};

startServer();
