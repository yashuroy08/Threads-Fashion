const mongoose = require('mongoose');
require('dotenv').config();

const ProductSchema = new mongoose.Schema({}, { strict: false });

// Replicate the logic from the new pre-save hook
ProductSchema.methods.syncVariants = function () {
    if (this.variants && this.variants.length > 0) {
        console.log(`Syncing product: ${this.title}`);

        // Extract unique sizes and colors
        const uniqueSizes = [...new Set(this.variants.map(v => v.size).filter(Boolean))];
        const uniqueColors = [...new Set(this.variants.map(v => v.color).filter(Boolean))];

        console.log('  Found Sizes:', uniqueSizes);
        console.log('  Found Colors:', uniqueColors);

        this.sizes = uniqueSizes;
        this.colors = uniqueColors;

        // Stock
        this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
        this.reservedStock = this.variants.reduce((sum, v) => sum + (v.reservedStock || 0), 0);
        this.inStock = this.stock > 0;

        return true;
    }
    return false;
};

const Product = mongoose.model('Product', ProductSchema);

async function fix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find products with variants
        const products = await Product.find({ 'variants.0': { $exists: true } });

        console.log(`Found ${products.length} products with variants.`);

        for (const p of products) {
            if (p.syncVariants()) {
                await p.save();
                console.log('  Saved.');
            }
        }

        console.log('Done.');
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}
fix();
