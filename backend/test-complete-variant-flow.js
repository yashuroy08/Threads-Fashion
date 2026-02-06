const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Define schemas with strict:false for flexibility
const ProductSchema = new mongoose.Schema({}, { strict: false });
const OrderSchema = new mongoose.Schema({}, { strict: false });

const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);

async function testCompleteFlow() {
    try {
        console.log('🔍 COMPLETE VARIANT FLOW TEST\n');
        console.log('='.repeat(60));
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Find a product with variants
        const product = await Product.findOne({ slug: 'levis-511-slim-fit-jeans' });
        if (!product) {
            console.log('❌ Test product not found');
            process.exit(1);
        }

        console.log('📦 PRODUCT:', product.title);
        console.log(`   Total Stock: ${product.stock}`);
        console.log(`   Variants: ${product.variants.length}\n`);

        // 2. Find S/Blue variant
        const targetSize = 'S';
        const targetColor = 'Blue';
        const variant = product.variants.find(v => v.size === targetSize && v.color === targetColor);

        if (!variant) {
            console.log(`❌ Variant ${targetSize}/${targetColor} not found`);
            process.exit(1);
        }

        console.log(`📊 VARIANT BEFORE: ${targetSize}/${targetColor}`);
        console.log(`   Stock: ${variant.stock}`);
        console.log(`   Reserved: ${variant.reservedStock}`);
        console.log(`   Available: ${variant.stock - variant.reservedStock}\n`);

        // 3. Find recent orders with this variant
        const recentOrders = await Order.find({
            'items.productId': product._id.toString(),
            'items.size': targetSize,
            'items.color': targetColor
        }).sort({ createdAt: -1 }).limit(5);

        console.log(`🛒 ORDERS WITH ${targetSize}/${targetColor}:`);
        if (recentOrders.length === 0) {
            console.log('   No orders found with this variant\n');
            console.log('   ⚠️  This means checkout is not storing size/color!\n');
        } else {
            recentOrders.forEach((order, idx) => {
                const item = order.items.find(i =>
                    i.productId === product._id.toString() &&
                    i.size === targetSize &&
                    i.color === targetColor
                );
                console.log(`   ${idx + 1}. Order ${order.orderId}`);
                console.log(`      Status: ${order.status}`);
                console.log(`      Quantity: ${item.quantity}`);
                console.log(`      Size: ${item.size || 'NOT SET ❌'}`);
                console.log(`      Color: ${item.color || 'NOT SET ❌'}`);
                console.log(`      Inventory Processed: ${order.inventoryProcessed ? 'Yes ✅' : 'No ❌'}`);
            });
            console.log();
        }

        // 4. Check for any delivered orders
        const deliveredOrders = await Order.find({
            'items.productId': product._id.toString(),
            status: 'DELIVERED'
        }).limit(3);

        console.log('📬 RECENT DELIVERED ORDERS:');
        if (deliveredOrders.length === 0) {
            console.log('   No delivered orders found\n');
        } else {
            deliveredOrders.forEach(order => {
                const item = order.items.find(i => i.productId === product._id.toString());
                console.log(`   - ${order.orderId}: ${item.quantity} units`);
                console.log(`     Size: ${item.size || 'MISSING'}, Color: ${item.color || 'MISSING'}`);
                console.log(`     Inventory Processed: ${order.inventoryProcessed ? 'Yes' : 'No'}`);
            });
            console.log();
        }

        // 5. Summary
        console.log('='.repeat(60));
        console.log('🎯 DIAGNOSIS:\n');

        if (recentOrders.length > 0 && recentOrders[0].items[0].size && recentOrders[0].items[0].color) {
            console.log('✅ Checkout IS storing size/color in orders');
        } else if (recentOrders.length > 0) {
            console.log('❌ Checkout is NOT storing size/color in orders');
            console.log('   → Fix checkout.service.ts to copy size/color from cart');
        }

        if (deliveredOrders.some(o => o.inventoryProcessed)) {
            console.log('✅ Inventory deduction IS happening on delivery');
        } else if (deliveredOrders.length > 0) {
            console.log('⚠️  Inventory deduction might not be happening');
        }

        console.log('\n💡 CURRENT VARIANT STATE:');
        console.log(`   ${targetSize}/${targetColor}: ${variant.stock} units`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testCompleteFlow();
