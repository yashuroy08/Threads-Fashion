const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function testVariantStockDeduction() {
    try {
        console.log('🔄 Testing variant stock deduction...\n');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find Levi's 511 Jeans
        const product = await Product.findOne({ slug: 'levis-511-slim-fit-jeans' });

        if (!product) {
            console.log('❌ Product not found');
            process.exit(1);
        }

        console.log(`📦 Product: ${product.title}`);
        console.log(`Total Stock: ${product.stock}\n`);

        // Find the S/Blue variant
        const variantIndex = product.variants.findIndex(
            v => v.size === 'S' && v.color === 'Blue'
        );

        if (variantIndex === -1) {
            console.log('❌ Variant S/Blue not found');
            console.log('Available variants:');
            product.variants.forEach(v => {
                console.log(`  - ${v.size} / ${v.color}: ${v.stock} units`);
            });
            process.exit(1);
        }

        const variant = product.variants[variantIndex];
        console.log(`📊 BEFORE Deduction:`);
        console.log(`   S/Blue variant stock: ${variant.stock}`);
        console.log(`   Total product stock: ${product.stock}\n`);

        // Deduct 3 units from S/Blue
        const quantityToDeduct = 3;
        console.log(`🔽 Deducting ${quantityToDeduct} units from S/Blue variant...\n`);

        product.variants[variantIndex].stock -= quantityToDeduct;
        await product.save(); // This triggers the pre-save hook to update total stock

        // Fetch fresh data
        const updatedProduct = await Product.findOne({ slug: 'levis-511-slim-fit-jeans' });
        const updatedVariant = updatedProduct.variants.find(
            v => v.size === 'S' && v.color === 'Blue'
        );

        console.log(`📊 AFTER Deduction:`);
        console.log(`   S/Blue variant stock: ${updatedVariant.stock}`);
        console.log(`   Total product stock: ${updatedProduct.stock}\n`);

        console.log('✅ Stock deduction successful!');
        console.log(`\n📝 Summary:`);
        console.log(`   - Deducted ${quantityToDeduct} units from S/Blue`);
        console.log(`   - Variant stock: ${variant.stock} → ${updatedVariant.stock}`);
        console.log(`   - Total stock: ${product.stock} → ${updatedProduct.stock}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testVariantStockDeduction();
