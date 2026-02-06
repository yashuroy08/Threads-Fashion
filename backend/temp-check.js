const mongoose = require('mongoose');

// Define minimal schema locally to avoid TS import issues
const ProductSchema = new mongoose.Schema({
    category: String,
    title: String,
    slug: String
});

const ProductModel = mongoose.model('Product', ProductSchema);

async function checkCategories() {
    try {
        await mongoose.connect('mongodb://localhost:27017/ecommerce');
        console.log('Connected to MongoDB');

        const counts = await ProductModel.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        console.log('Product Counts by Category:', JSON.stringify(counts, null, 2));

        const allProducts = await ProductModel.find({}, 'title category slug');
        console.log(`Total Products: ${allProducts.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkCategories();
