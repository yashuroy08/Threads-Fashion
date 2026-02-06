
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { ProductModel } from './src/modules/catalog/models/product.model';

dotenv.config({ path: path.join(__dirname, '.env') });

const updateStock = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected.');

        console.log('Updating all products to have stock=50...');
        const result = await ProductModel.updateMany(
            {},
            {
                $set: {
                    stock: 50,
                    reservedStock: 0,
                    inStock: true
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} products.`);
        process.exit(0);
    } catch (error) {
        console.error('Error updating stock:', error);
        process.exit(1);
    }
};

updateStock();
