const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import the actual models and services
const { ProductModel } = require('./dist/modules/catalog/models/product.model');
const { finalizeVariantInventory } = require('./dist/modules/catalog/services/inventory.service');

async function testVariantDeduction() {
    try {
        console.log('🧪 TESTING VARIANT STOCK DEDUCTION\n');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find product
        const product = await ProductModel.findOne({ slug: 'levis-511-slim-fit-jeans' });
        if (!product) {
            console.log('❌ Product not found');
            process.exit(1);
        }

        console.log(`📦 Product: ${product.title}`);
        console.log(`Total Stock BEFORE: ${product.stock}\n`);

        // Find S/Blue variant
        const beforeVariant = product.variants.find(v => v.size === 'S' && v.color === 'Blue');
        if (!beforeVariant) {
            console.log('❌ S/Blue variant not found');
            process.exit(1);
        }

        console.log('S/Blue Variant BEFORE:');
        console.log(`  Stock: ${beforeVariant.stock}`);
        console.log(`  Reserved: ${beforeVariant.reservedStock || 0}\n`);

        // Test deduction
        console.log('🔽 Calling finalizeVariantInventory(productId, "S", "Blue", 1)...\n');

        try {
            await finalizeVariantInventory(
                product._id.toString(),
                'S',
                'Blue',
                1
            );
            console.log('✅ Function executed successfully!\n');
        } catch (error) {
            console.log(`❌ Function failed: ${error.message}\n`);
            process.exit(1);
        }

        // Check result
        const updatedProduct = await ProductModel.findById(product._id);
        const afterVariant = updatedProduct.variants.find(v => v.size === 'S' && v.color === 'Blue');

        console.log('S/Blue Variant AFTER:');
        console.log(`  Stock: ${afterVariant.stock}`);
        console.log(`  Reserved: ${afterVariant.reservedStock || 0}\n`);

        console.log(`Total Stock AFTER: ${updatedProduct.stock}\n`);

        console.log('📊 RESULT:');
        console.log(`  Variant Stock Changed: ${beforeVariant.stock} → ${afterVariant.stock}`);
        console.log(`  Total Stock Changed: ${product.stock} → ${updatedProduct.stock}`);

        if (beforeVariant.stock === afterVariant.stock) {
            console.log('\n❌ VARIANT STOCK NOT DEDUCTED - FUNCTION NOT WORKING!');
        } else if (afterVariant.stock === beforeVariant.stock - 1) {
            console.log('\n✅ VARIANT STOCK DEDUCTED CORRECTLY!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testVariantDeduction();
