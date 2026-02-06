import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { UserModel } from '../modules/catalog/models/user.model';
import path from 'path';

// Load env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const promoteUser = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const email = 'yashwanthp2335.sse@saveetha.com';
        const user = await UserModel.findOneAndUpdate(
            { email: email },
            { role: 'admin' },
            { new: true }
        );

        if (user) {
            console.log(`SUCCESS: User ${user.email} is now an ADMIN.`);
            console.log('User details:', { id: user._id, role: user.role, email: user.email });
        } else {
            console.error(`ERROR: User with email ${email} not found.`);
        }

    } catch (error) {
        console.error('Script failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

promoteUser();
