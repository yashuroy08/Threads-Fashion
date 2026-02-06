const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ProductSchema = new mongoose.Schema({}, { strict: false });
const OrderSchema = new mongoose.Schema({}, { strict: false });
const CartSchema = new mongoose.Schema({}, { strict: false });

const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);
const Cart = mongoose.model('Cart', CartSchema);

async function fullSystemDiagnostic() {
    try {
        console.log('🔍 COMPLETE VARIANT STOCK DEDUCTION DIAGNOSTIC\n');
        console.log('='.repeat(70));
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Step 1: Check product variants
        const product = await Product.findOne({ slug: 'levis-511-slim-fit-jeans' });
        if (!product) {
            console.log('❌ Product not found');
            process.exit(1);
        }

        console.log('📦 STEP 1: PRODUCT STATE');
        console.log('-'.repeat(70));
        console.log(`Product: ${product.title}`);
        console.log(`Total Stock: ${product.stock}`);
        console.log(`Variants Count: ${product.variants.length}\n`);

        const targetVariant = product.variants.find(v => v.size === 'S' && v.color === 'Blue');
        if (!targetVariant) {
            console.log('❌ S/Blue variant not found');
            process.exit(1);
        }

        console.log('Target Variant (S/Blue):');
        console.log(`  Stock: ${targetVariant.stock}`);
        console.log(`  Reserved: ${targetVariant.reservedStock || 0}`);
        console.log(`  Available: ${targetVariant.stock - (targetVariant.reservedStock || 0)}\n`);

        // Step 2: Check cart items
        const carts = await Cart.find({
            'items.productId': product._id
        }).limit(3);

        console.log('🛒 STEP 2: CART ITEMS');
        console.log('-'.repeat(70));
        if (carts.length === 0) {
            console.log('No cart items found\n');
        } else {
            carts.forEach((cart, idx) => {
                const item = cart.items.find(i => i.productId.toString() === product._id.toString());
                if (item) {
                    console.log(`Cart ${idx + 1}:`);
                    console.log(`  Product ID: ${item.productId}`);
                    console.log(`  Quantity: ${item.quantity}`);
                    console.log(`  Size: ${item.size || 'NOT SET ❌'}`);
                    console.log(`  Color: ${item.color || 'NOT SET ❌'}\n`);
                }
            });
        }

        // Step 3: Check recent orders
        const recentOrders = await Order.find({
            'items.productId': product._id.toString()
        }).sort({ createdAt: -1 }).limit(5);

        console.log('📋 STEP 3: RECENT ORDERS');
        console.log('-'.repeat(70));
        if (recentOrders.length === 0) {
            console.log('No orders found\n');
        } else {
            recentOrders.forEach((order, idx) => {
                const item = order.items.find(i => i.productId === product._id.toString());
                console.log(`Order ${idx + 1}: ${order.orderId}`);
                console.log(`  Status: ${order.status}`);
                console.log(`  Inventory Processed: ${order.inventoryProcessed ? 'YES ✅' : 'NO ❌'}`);
                console.log(`  Product ID: ${item.productId}`);
                console.log(`  Quantity: ${item.quantity}`);
                console.log(`  Size: ${item.size || 'NOT SET ❌'}`);
                console.log(`  Color: ${item.color || 'NOT SET ❌'}`);

                if (order.status === 'DELIVERED' && item.size && item.color) {
                    console.log(`  ⚠️  DELIVERED order has variant info - should have deducted!`);
                }
                console.log();
            });
        }

        // Step 4: Find delivered orders with variants
        const deliveredWithVariants = await Order.find({
            'items.productId': product._id.toString(),
            status: 'DELIVERED',
            'items.size': { $exists: true, $ne: null },
            'items.color': { $exists: true, $ne: null }
        });

        console.log('🚚 STEP 4: DELIVERED ORDERS WITH VARIANTS');
        console.log('-'.repeat(70));
        if (deliveredWithVariants.length === 0) {
            console.log('❌ NO delivered orders with size/color found!');
            console.log('This means either:');
            console.log('  1. No orders have been delivered yet');
            console.log('  2. Orders don\'t have size/color (checkout not copying)\n');
        } else {
            console.log(`✅ Found ${deliveredWithVariants.length} delivered order(s) with variants`);
            deliveredWithVariants.forEach(order => {
                const item = order.items.find(i =>
                    i.productId === product._id.toString() &&
                    i.size && i.color
                );
                console.log(`  - ${order.orderId}: ${item.quantity}x ${item.size}/${item.color}`);
                console.log(`    Inventory Processed: ${order.inventoryProcessed ? 'YES' : 'NO'}`);
            });
            console.log();
        }

        // Step 5: Analysis
        console.log('='.repeat(70));
        console.log('📊 DIAGNOSTIC SUMMARY\n');

        let issuesFound = [];

        if (carts.some(c => c.items.some(i => i.productId.toString() === product._id.toString() && (!i.size || !i.color)))) {
            issuesFound.push('⚠️  Cart items missing size/color - Check ProductDetails addToCart');
        }

        if (recentOrders.some(o => o.items.some(i => i.productId === product._id.toString() && (!i.size || !i.color)))) {
            issuesFound.push('⚠️  Order items missing size/color - Check checkout.service.ts');
        }

        if (deliveredWithVariants.length > 0 && !deliveredWithVariants.some(o => o.inventoryProcessed)) {
            issuesFound.push('❌ CRITICAL: Delivered orders with variants NOT marked as inventory processed!');
            issuesFound.push('   → Check order.service.ts updateOrderStatus function');
        }

        if (deliveredWithVariants.length > 0 && deliveredWithVariants.some(o => o.inventoryProcessed)) {
            issuesFound.push('⚠️  Orders marked as processed but variant stock unchanged');
            issuesFound.push('   → Check finalizeVariantInventory function');
            issuesFound.push('   → Check if pre-save hook is running');
        }

        if (issuesFound.length === 0) {
            console.log('✅ No issues found in data - system should be working correctly');
        } else {
            console.log('Issues Found:');
            issuesFound.forEach(issue => console.log(`  ${issue}`));
        }

        console.log('\n' + '='.repeat(70));
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fullSystemDiagnostic();
