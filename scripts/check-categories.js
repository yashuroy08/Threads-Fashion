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

        console.log('Product Counts by Category:');
        console.table(counts);

        const allProducts = await ProductModel.find({}, 'title category slug').limit(20);
        console.log('Sample Products:', allProducts);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkCategories();
