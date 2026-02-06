const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

async function migrateToVariants() {
    try {
        console.log('🔄 Starting migration to variant-level stock...\n');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const products = await Product.find({});
        console.log(`Found ${products.length} products to migrate\n`);

        let migrated = 0;
        let skipped = 0;

        for (const product of products) {
            // Skip if already has variants
            if (product.variants && product.variants.length > 0) {
                console.log(`⏭️  Skipping "${product.title}" - already has variants`);
                skipped++;
                continue;
            }

            const sizes = product.sizes || [];
            const colors = product.colors || [];
            const totalStock = product.stock || 50;

            // Generate all size+color combinations
            const variants = [];

            if (sizes.length > 0 && colors.length > 0) {
                // Distribute stock evenly across all variants
                const stockPerVariant = Math.floor(totalStock / (sizes.length * colors.length));

                for (const size of sizes) {
                    for (const color of colors) {
                        variants.push({
                            size,
                            color,
                            stock: stockPerVariant,
                            reservedStock: 0,
                            sku: `${product.slug}-${size}-${color}`.toLowerCase().replace(/\s+/g, '-')
                        });
                    }
                }
            } else if (sizes.length > 0) {
                // Only sizes, no colors
                const stockPerVariant = Math.floor(totalStock / sizes.length);
                for (const size of sizes) {
                    variants.push({
                        size,
                        color: 'Default',
                        stock: stockPerVariant,
                        reservedStock: 0,
                        sku: `${product.slug}-${size}`.toLowerCase().replace(/\s+/g, '-')
                    });
                }
            } else if (colors.length > 0) {
                // Only colors, no sizes
                const stockPerVariant = Math.floor(totalStock / colors.length);
                for (const color of colors) {
                    variants.push({
                        size: 'One Size',
                        color,
                        stock: stockPerVariant,
                        reservedStock: 0,
                        sku: `${product.slug}-${color}`.toLowerCase().replace(/\s+/g, '-')
                    });
                }
            } else {
                // No sizes or colors - create single default variant
                variants.push({
                    size: 'One Size',
                    color: 'Default',
                    stock: totalStock,
                    reservedStock: 0,
                    sku: product.slug
                });
            }

            // Update product with variants
            await Product.updateOne(
                { _id: product._id },
                {
                    $set: {
                        variants,
                        stock: totalStock,
                        reservedStock: 0
                    }
                }
            );

            console.log(`✅ Migrated "${product.title}" - ${variants.length} variants created`);
            migrated++;
        }

        console.log('\n=== MIGRATION SUMMARY ===');
        console.log(`✅ Migrated: ${migrated} products`);
        console.log(`⏭️  Skipped: ${skipped} products`);
        console.log(`📦 Total: ${products.length} products\n`);

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateToVariants();
