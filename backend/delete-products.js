const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    category: String,
    title: String
});
const ProductModel = mongoose.model('Product', ProductSchema);

async function cleanProducts() {
    try {
        await mongoose.connect('mongodb://localhost:27017/ecommerce');
        console.log('Connected.');

        // Deleting all products as per request "remove all the exisiting products"
        const result = await ProductModel.deleteMany({});
        console.log(`Deleted ${result.deletedCount} products.`);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

cleanProducts();
