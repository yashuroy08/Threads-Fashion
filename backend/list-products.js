const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    category: String,
    title: String,
    slug: String
});
const ProductModel = mongoose.model('Product', ProductSchema);

async function listProducts() {
    try {
        await mongoose.connect('mongodb://localhost:27017/ecommerce');
        console.log('Connected.');

        const products = await ProductModel.find({}, 'title category slug');

        console.log('--- PRODUCT LIST ---');
        products.forEach(p => {
            console.log(`[${p.category || 'NULL'}] ${p.title} (${p.slug})`);
        });
        console.log('--------------------');

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listProducts();
