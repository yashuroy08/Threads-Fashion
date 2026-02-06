const mongoose = require('mongoose');
require('dotenv').config();

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const product = await Product.findOne({ title: { $regex: 'Jacket', $options: 'i' } }).sort({ updatedAt: -1 });

        if (product) {
            console.log('------------------------------------------------');
            console.log('PRODUCT:', product.title);
            console.log('COLORS ARRAY:', JSON.stringify(product.colors));
            console.log('VARIANTS COUNT:', product.variants ? product.variants.length : 0);
            if (product.variants) {
                console.log('VARIANT COLORS:', product.variants.map(v => v.color));
            }
            console.log('------------------------------------------------');
        } else {
            console.log('Product not found');
        }
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}
diagnose();
