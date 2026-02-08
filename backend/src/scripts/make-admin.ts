import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { UserModel } from '../modules/catalog/models/user.model';

const makeAdmin = async (email: string) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to MongoDB');

        // Find user by email
        const user = await UserModel.findOne({ email });

        if (!user) {
            console.error(`User with email "${email}" not found`);
            process.exit(1);
        }

        // Update role to admin
        user.role = 'admin';
        await user.save();

        console.log(`✅ User "${user.firstName} ${user.lastName}" (${user.email}) is now an admin!`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.error('Usage: npm run make-admin <email>');
    process.exit(1);
}

makeAdmin(email);
