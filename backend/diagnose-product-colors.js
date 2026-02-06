const mongoose = require('mongoose');
const { Schema } = mongoose;
require('dotenv').config();

// Minimal Schema to read Product
const ProductSchema = new Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Allow loose matching for the title or slug
        const product = await Product.findOne({
            $or: [
                { title: { $regex: 'Jacket', $options: 'i' } },
                { slug: { $regex: 'jacket', $options: 'i' } }
            ]
        }).sort({ updatedAt: -1 }); // Get the most recently updated one

        if (!product) {
            console.log('Product not found');
        } else {
            console.log('Product Found:', product.title);
            console.log('ID:', product._id);
            console.log('Colors Array:', product.colors);
            console.log('Variants:', JSON.stringify(product.variants, null, 2));
            console.log('Images:', JSON.stringify(product.images, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
