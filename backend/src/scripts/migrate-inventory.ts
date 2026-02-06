import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ProductModel } from '../modules/catalog/models/product.model';

dotenv.config();

async function migrate() {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected to DB...');

    const products = await ProductModel.find({});

    for (const p of products) {
        // If 'stock' is 0 but 'stockQuantity' has value, migrate it
        if (p.stock === 0 && (p as any).stockQuantity > 0) {
            p.stock = (p as any).stockQuantity;
            p.reservedStock = 0;
            await p.save();
            console.log(`Migrated: ${p.title} -> Stock: ${p.stock}`);
        }
    }

    console.log('Migration complete');
    process.exit();
}

migrate();