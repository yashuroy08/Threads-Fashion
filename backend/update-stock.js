
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const productSchema = new mongoose.Schema({
    stock: Number,
    reservedStock: Number,
    inStock: Boolean
}, { strict: false });

const Product = mongoose.model('Product', productSchema);

const updateStock = async () => {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log('Updating all products to have stock=50...');
        const result = await Product.updateMany(
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
