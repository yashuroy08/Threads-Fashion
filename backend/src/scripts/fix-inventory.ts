import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ProductModel } from '../modules/catalog/models/product.model';

dotenv.config();

async function fixInventory() {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to DB');

        // Update ALL products that don't have a 'stock' field
        const result = await ProductModel.updateMany(
            { stock: { $exists: false } },
            {
                $set: {
                    stock: 50,         // Default to 50 items
                    reservedStock: 0,  // Reset reservations
                    inStock: true      // Mark as available
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} products with default inventory.`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

fixInventory();