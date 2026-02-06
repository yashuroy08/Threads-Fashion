const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', ProductSchema);

const CategorySchema = new mongoose.Schema({}, { strict: false });
const Category = mongoose.model('Category', CategorySchema);

const products = [
    // MEN'S JEANS
    {
        title: "Levi's 511 Slim Fit Jeans",
        slug: "levis-511-slim-fit-jeans",
        description: "Timeless slim fit jeans with a classic fit and spread collar. Made from 100% cotton denim with mother-of-pearl buttons. Features the iconic Levi's branding. Ideal for both casual and semi-formal occasions. This premium denim is crafted from the finest materials, ensuring exceptional comfort and durability.",
        parentCategoryId: "Men",
        childCategoryId: "Men Jeans",
        price: { amount: 449900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1542272604-787c3835535d", altText: "Levi's 511 Jeans Front" },
            { url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246", altText: "Levi's 511 Jeans Side" }
        ],
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Blue", "Black", "Grey"],
        stock: 50,
        reservedStock: 0,
        inStock: true,
        isFeatured: true
    },
    {
        title: "Wrangler Regular Fit Denim",
        slug: "wrangler-regular-fit-denim",
        description: "Classic regular fit denim jeans perfect for everyday wear. Made with premium quality cotton blend fabric that provides comfort and durability. Features traditional five-pocket styling with signature Wrangler stitching. These jeans are designed to last through countless wears while maintaining their shape and color.",
        parentCategoryId: "Men",
        childCategoryId: "Men Jeans",
        price: { amount: 329900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1475178626620-a4d074967452", altText: "Wrangler Jeans" }
        ],
        sizes: ["M", "L", "XL"],
        colors: ["Blue", "Black"],
        stock: 45,
        reservedStock: 0,
        inStock: true,
        isFeatured: false
    },

    // MEN'S SHIRTS
    {
        title: "Ralph Lauren Classic Fit Shirt",
        slug: "ralph-lauren-classic-fit-shirt",
        description: "Premium dress shirt with classic fit and spread collar. Made from 100% Egyptian cotton poplin with mother-of-pearl buttons. Features the iconic Ralph Lauren pony logo. Perfect for formal and semi-formal events. This shirt is crafted from the finest Egyptian cotton, ensuring exceptional softness and durability. The classic fit provides a comfortable, traditional silhouette.",
        parentCategoryId: "Men",
        childCategoryId: "Men Shirts",
        price: { amount: 549900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c", altText: "Ralph Lauren Shirt" }
        ],
        sizes: ["S", "M", "L", "XL"],
        colors: ["White", "Blue", "Pink"],
        stock: 40,
        reservedStock: 0,
        inStock: true,
        isFeatured: true
    },
    {
        title: "Tommy Hilfiger Oxford Shirt",
        slug: "tommy-hilfiger-oxford-shirt",
        description: "Classic Oxford shirt with button-down collar and signature Tommy Hilfiger flag logo. Made from premium cotton Oxford fabric for a refined look. Perfect for business casual settings. The Oxford weave provides texture and breathability, making it comfortable for all-day wear. Features a tailored fit that flatters without being restrictive.",
        parentCategoryId: "Men",
        childCategoryId: "Men Shirts",
        price: { amount: 399900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf", altText: "Tommy Hilfiger Shirt" }
        ],
        sizes: ["M", "L", "XL", "XXL"],
        colors: ["White", "Light Blue", "Navy"],
        stock: 35,
        reservedStock: 0,
        inStock: true,
        isFeatured: false
    },

    // MEN'S T-SHIRTS
    {
        title: "Nike Dri-FIT Performance Tee",
        slug: "nike-dri-fit-performance-tee",
        description: "High-performance athletic t-shirt with Nike's signature Dri-FIT moisture-wicking technology. Keeps you dry and comfortable during intense workouts. Features the iconic Nike swoosh logo. Made from lightweight, breathable fabric that moves with you. Perfect for running, gym sessions, or casual athletic wear.",
        parentCategoryId: "Men",
        childCategoryId: "Men T-Shirts",
        price: { amount: 249900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab", altText: "Nike Tee" }
        ],
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black", "White", "Grey", "Navy"],
        stock: 60,
        reservedStock: 0,
        inStock: true,
        isFeatured: true
    },
    {
        title: "Adidas Essentials Cotton Tee",
        slug: "adidas-essentials-cotton-tee",
        description: "Comfortable everyday t-shirt made from soft cotton jersey fabric. Features the classic Adidas three-stripe logo. Perfect for casual wear and light activities. This essential tee offers a relaxed fit and premium comfort for all-day wear. Made from sustainably sourced cotton.",
        parentCategoryId: "Men",
        childCategoryId: "Men T-Shirts",
        price: { amount: 179900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a", altText: "Adidas Tee" }
        ],
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Black", "White", "Grey"],
        stock: 55,
        reservedStock: 0,
        inStock: true,
        isFeatured: false
    },

    // MEN'S JACKETS
    {
        title: "North Face Thermoball Jacket",
        slug: "north-face-thermoball-jacket",
        description: "Lightweight insulated jacket with ThermoBall™ Eco insulation that mimics down warmth. Water-resistant finish protects against light rain. Features zippered hand pockets and elastic-bound cuffs. Perfect for cold weather outdoor activities. Packable design makes it easy to carry when not in use.",
        parentCategoryId: "Men",
        childCategoryId: "Men Jackets",
        price: { amount: 899900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1551028719-00167b16eac5", altText: "North Face Jacket" }
        ],
        sizes: ["M", "L", "XL"],
        colors: ["Black", "Navy", "Olive"],
        stock: 30,
        reservedStock: 0,
        inStock: true,
        isFeatured: true
    },

    // WOMEN'S JEANS
    {
        title: "Levi's 721 High Rise Skinny Jeans",
        slug: "levis-721-high-rise-skinny-jeans",
        description: "Modern high-rise skinny jeans that lift and sculpt. Made from premium stretch denim for all-day comfort. Features classic five-pocket styling with signature Levi's red tab. These jeans are designed to flatter your figure while providing exceptional comfort and flexibility. Perfect for creating versatile outfits.",
        parentCategoryId: "Women",
        childCategoryId: "Women Jeans",
        price: { amount: 469900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246", altText: "Levi's Women Jeans" }
        ],
        sizes: ["XS", "S", "M", "L", "XL"],
        colors: ["Blue", "Black", "White"],
        stock: 50,
        reservedStock: 0,
        inStock: true,
        isFeatured: true
    },

    // WOMEN'S DRESSES
    {
        title: "Zara Floral Midi Dress",
        slug: "zara-floral-midi-dress",
        description: "Elegant floral print midi dress perfect for spring and summer occasions. Features a flattering A-line silhouette with a fitted bodice and flowing skirt. Made from lightweight, breathable fabric. Includes a concealed back zipper and adjustable shoulder straps. Perfect for garden parties, weddings, or special events.",
        parentCategoryId: "Women",
        childCategoryId: "Women Dresses",
        price: { amount: 599900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8", altText: "Zara Dress" }
        ],
        sizes: ["XS", "S", "M", "L"],
        colors: ["Floral Blue", "Floral Pink", "Floral Yellow"],
        stock: 35,
        reservedStock: 0,
        inStock: true,
        isFeatured: true
    },
    {
        title: "H&M Casual Summer Dress",
        slug: "hm-casual-summer-dress",
        description: "Comfortable and stylish casual dress perfect for everyday wear. Made from soft cotton blend fabric with a relaxed fit. Features short sleeves and a knee-length hem. Easy to style with sandals or sneakers. Machine washable for easy care. Available in vibrant summer colors.",
        parentCategoryId: "Women",
        childCategoryId: "Women Dresses",
        price: { amount: 349900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1", altText: "H&M Dress" }
        ],
        sizes: ["S", "M", "L", "XL"],
        colors: ["Red", "Blue", "Green", "Yellow"],
        stock: 40,
        reservedStock: 0,
        inStock: true,
        isFeatured: false
    },

    // WOMEN'S TOPS
    {
        title: "Mango Silk Blend Blouse",
        slug: "mango-silk-blend-blouse",
        description: "Luxurious silk blend blouse with elegant draping and a sophisticated sheen. Features a classic collar and button-front closure. Perfect for office wear or evening events. The silk blend fabric offers comfort and breathability while maintaining a polished appearance. Pairs beautifully with tailored pants or skirts.",
        parentCategoryId: "Women",
        childCategoryId: "Women Tops",
        price: { amount: 429900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1564257577-7fd5f1b1d9c0", altText: "Mango Blouse" }
        ],
        sizes: ["XS", "S", "M", "L"],
        colors: ["White", "Black", "Cream", "Navy"],
        stock: 45,
        reservedStock: 0,
        inStock: true,
        isFeatured: false
    },

    // WOMEN'S SHOES
    {
        title: "Steve Madden Platform Heels",
        slug: "steve-madden-platform-heels",
        description: "Trendy platform heels that add height and style to any outfit. Features a chunky heel for stability and comfort. Made from premium faux leather with cushioned insole. Perfect for parties, nights out, or special occasions. The platform design provides extra comfort compared to traditional heels.",
        parentCategoryId: "Women",
        childCategoryId: "Women Shoes",
        price: { amount: 649900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2", altText: "Steve Madden Heels" }
        ],
        sizes: ["5", "6", "7", "8", "9"],
        colors: ["Black", "Nude", "Red"],
        stock: 30,
        reservedStock: 0,
        inStock: true,
        isFeatured: true
    },

    // KIDS BOYS
    {
        title: "Gap Kids Graphic Tee",
        slug: "gap-kids-graphic-tee",
        description: "Fun and colorful graphic t-shirt for boys. Made from soft, breathable cotton that's gentle on sensitive skin. Features vibrant prints and designs kids love. Durable construction withstands active play and frequent washing. Perfect for school, playdates, or casual outings. Available in multiple fun designs.",
        parentCategoryId: "Kids",
        childCategoryId: "Kids Boys",
        price: { amount: 129900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea", altText: "Gap Kids Tee" }
        ],
        sizes: ["4-5Y", "6-7Y", "8-9Y", "10-11Y"],
        colors: ["Blue", "Red", "Green", "Yellow"],
        stock: 50,
        reservedStock: 0,
        inStock: true,
        isFeatured: false
    },

    // KIDS GIRLS
    {
        title: "Carter's Floral Dress",
        slug: "carters-floral-dress",
        description: "Adorable floral dress for girls with a twirl-worthy skirt. Made from soft, comfortable fabric perfect for all-day wear. Features a cute bow detail and easy-on design. Machine washable for busy parents. Perfect for parties, family gatherings, or special occasions. Designed with comfort and style in mind.",
        parentCategoryId: "Kids",
        childCategoryId: "Kids Girls",
        price: { amount: 179900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7", altText: "Carter's Dress" }
        ],
        sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
        colors: ["Pink", "Purple", "Blue"],
        stock: 45,
        reservedStock: 0,
        inStock: true,
        isFeatured: false
    },

    // MEN'S SHOES
    {
        title: "Nike Air Max 270",
        slug: "nike-air-max-270",
        description: "Iconic Nike Air Max sneakers with visible Air cushioning for maximum comfort. Features breathable mesh upper and durable rubber outsole. Perfect for running, training, or casual wear. The Air Max 270 unit provides exceptional cushioning and impact protection. Modern design meets legendary comfort.",
        parentCategoryId: "Men",
        childCategoryId: "Men Shoes",
        price: { amount: 749900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff", altText: "Nike Air Max" }
        ],
        sizes: ["7", "8", "9", "10", "11"],
        colors: ["Black", "White", "Blue", "Red"],
        stock: 40,
        reservedStock: 0,
        inStock: true,
        isFeatured: true
    },
    {
        title: "Adidas Ultraboost 22",
        slug: "adidas-ultraboost-22",
        description: "Premium running shoes with responsive Boost cushioning technology. Features a Primeknit upper that adapts to your foot for a sock-like fit. Continental rubber outsole provides superior traction. Perfect for serious runners and fitness enthusiasts. Combines performance technology with sleek, modern design.",
        parentCategoryId: "Men",
        childCategoryId: "Men Shoes",
        price: { amount: 899900, currency: "INR" },
        images: [
            { url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5", altText: "Adidas Ultraboost" }
        ],
        sizes: ["7", "8", "9", "10", "11", "12"],
        colors: ["Black", "White", "Grey"],
        stock: 35,
        reservedStock: 0,
        inStock: true,
        isFeatured: true
    }
];

async function reseedProducts() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Step 1: Delete all existing products
        console.log('🗑️  Deleting all existing products...');
        const deleteResult = await Product.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.deletedCount} products\n`);

        // Step 2: Get category mappings
        console.log('📂 Fetching categories...');
        const categories = await Category.find({});
        const categoryMap = {};

        categories.forEach(cat => {
            categoryMap[cat.name] = cat._id.toString();
        });

        console.log('Available categories:', Object.keys(categoryMap));
        console.log('');

        // Step 3: Insert new products with proper category IDs
        console.log('📦 Creating new products...\n');
        const productsToInsert = products.map(product => {
            const parentId = categoryMap[product.parentCategoryId];
            const childId = categoryMap[product.childCategoryId];

            if (!parentId || !childId) {
                console.warn(`⚠️  Warning: Category not found for ${product.title}`);
                console.warn(`   Parent: ${product.parentCategoryId} -> ${parentId}`);
                console.warn(`   Child: ${product.childCategoryId} -> ${childId}\n`);
            }

            return {
                ...product,
                parentCategoryId: parentId || product.parentCategoryId,
                childCategoryId: childId || product.childCategoryId,
                isActive: true,
                isFeatured: product.isFeatured || false,
                discountPercentage: 0
            };
        });

        const insertedProducts = await Product.insertMany(productsToInsert);
        console.log(`✅ Successfully created ${insertedProducts.length} products\n`);

        // Step 4: Display summary
        console.log('=== PRODUCT SUMMARY ===\n');
        const summary = {};
        insertedProducts.forEach(p => {
            const category = p.childCategoryId;
            if (!summary[category]) summary[category] = 0;
            summary[category]++;
        });

        Object.entries(summary).forEach(([category, count]) => {
            const categoryName = categories.find(c => c._id.toString() === category)?.name || category;
            console.log(`${categoryName}: ${count} products`);
        });

        console.log('\n✅ Product database reseeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

reseedProducts();
