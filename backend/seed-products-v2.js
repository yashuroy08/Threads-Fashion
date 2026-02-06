const mongoose = require('mongoose');

// Schemas (Simplified for seeding, matching the real ones)
const CategorySchema = new mongoose.Schema({
    name: String,
    slug: String,
    parentId: String
});

const ProductVariantSchema = new mongoose.Schema({
    size: String,
    color: String,
    stock: Number,
    reservedStock: Number,
    sku: String
}, { _id: false });

const ProductSchema = new mongoose.Schema({
    title: String,
    slug: String,
    description: String,
    parentCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    childCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    price: {
        amount: Number,
        currency: String
    },
    images: [{
        url: String,
        altText: String,
        color: String // <--- The new field
    }],
    sizes: [String],
    colors: [String],
    variants: [ProductVariantSchema],
    isActive: Boolean,
    inStock: Boolean,
    stock: Number,
    reservedStock: Number,
    isFeatured: Boolean
}, { timestamps: true });

const CategoryModel = mongoose.model('Category', CategorySchema);
const ProductModel = mongoose.model('Product', ProductSchema);

async function seedProductsV2() {
    try {
        await mongoose.connect('mongodb://localhost:27017/ecommerce');
        console.log('Connected to MongoDB');

        // Fetch categories
        const categories = await CategoryModel.find({});
        const catMap = {};
        categories.forEach(cat => {
            catMap[cat.slug] = cat._id;
        });

        // Clear existing products (Just to be sure)
        await ProductModel.deleteMany({});
        console.log('Cleared existing products');

        // --- Helper to generate variants ---
        function createVariants(sizes, colors, stockPerVariant = 10) {
            const variants = [];
            let totalStock = 0;
            colors.forEach(color => {
                sizes.forEach(size => {
                    variants.push({
                        size,
                        color,
                        stock: stockPerVariant,
                        reservedStock: 0,
                        sku: `${color}-${size}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase()
                    });
                    totalStock += stockPerVariant;
                });
            });
            return { variants, totalStock };
        }

        // --- Helper for Images ---
        // Returns 4 images for a specific color
        function getImagesForColor(baseKeyword, color, count = 4) {
            const images = [];
            for (let i = 0; i < count; i++) {
                images.push({
                    url: `https://source.unsplash.com/random/800x1000/?${baseKeyword},${color},fashion,${i}`,
                    // Note: Unsplash source is deprecated/unreliable for strict sets, using placeholder logic or specific IDs below would be better.
                    // But for "demo" distinct urls:
                    // utilizing query param to make them distinct strings, though Unsplash might return same image.
                    // Better approach: specific IDs if known, or generic fashion images.
                    // Let's use a reliable set of roughly matching images or just generic ones.
                    url: `https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800&v=${color}${i}`, // Mocking distinct URL
                    altText: `${baseKeyword} - ${color} View ${i + 1}`,
                    color: color
                });
            }
            return images;
        }

        /* 
           Using specific Unsplash IDs for better quality.
           I will try to use different IDs for different colors to simulate the experience.
        */
        const products = [
            // 1. Men's Jeans (Blue & Black)
            {
                title: "Levi's 511 Slim Fit Jeans",
                slug: "levis-511-slim-fit-jeans",
                description: "The Levi's 511 Slim Fit Jeans sit below the waist with a slim fit from hip to ankle. Made from premium stretch denim.",
                parentCategoryId: catMap['men'],
                childCategoryId: catMap['men-jeans'],
                price: { amount: 449900, currency: 'INR' },
                sizes: ["28", "30", "32", "34"],
                colors: ["Blue", "Black"],
                images: [
                    // Blue Images
                    { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800", altText: "Front View", color: "Blue" },
                    { url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800", altText: "Side View", color: "Blue" },
                    { url: "https://images.unsplash.com/photo-1475178626620-a4d074967452?q=80&w=800", altText: "Back View", color: "Blue" },
                    { url: "https://images.unsplash.com/photo-1454177697940-c43d9f9c7320?q=80&w=800", altText: "Detail View", color: "Blue" },
                    // Black Images
                    { url: "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?q=80&w=800", altText: "Front View", color: "Black" },
                    { url: "https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?q=80&w=800", altText: "Side View", color: "Black" },
                    { url: "https://images.unsplash.com/photo-1604176354204-92e88ae84306?q=80&w=800", altText: "Back View", color: "Black" },
                    { url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800", altText: "Detail View", color: "Black" },
                ],
                ...createVariants(["28", "30", "32", "34"], ["Blue", "Black"]),
                isActive: true,
                inStock: true,
                reservedStock: 0,
                isFeatured: true
            },

            // 2. Women's Dress (Red & White)
            {
                title: "Zara Midi Wrap Dress",
                slug: "zara-midi-wrap-dress",
                description: "Elegant midi-length wrap dress with a flattering V-neckline and tie waist. Perfect for occasions.",
                parentCategoryId: catMap['women'],
                childCategoryId: catMap['women-dresses'],
                price: { amount: 399900, currency: 'INR' },
                sizes: ["XS", "S", "M", "L"],
                colors: ["Red", "White"],
                images: [
                    // Red
                    { url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800", altText: "Front", color: "Red" },
                    { url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800", altText: "Back", color: "Red" },
                    { url: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=800", altText: "Detail", color: "Red" },
                    { url: "https://images.unsplash.com/photo-1515372039744-b8f02f3c4bdb?q=80&w=800", altText: "Side", color: "Red" },
                    // White
                    { url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800", altText: "Front", color: "White" },
                    { url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=800", altText: "Side", color: "White" },
                    { url: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=800", altText: "Back", color: "White" },
                    { url: "https://images.unsplash.com/photo-1589465885857-44edb59ef526?q=80&w=800", altText: "Detail", color: "White" },
                ],
                ...createVariants(["XS", "S", "M", "L"], ["Red", "White"]),
                isActive: true,
                inStock: true,
                reservedStock: 0,
                isFeatured: true
            },

            // 3. Men's Shoes (White & Black)
            {
                title: "Nike Air Max 90",
                slug: "nike-air-max-90",
                description: "Legendary running shoe with visible Air cushioning in the heel. Iconic design.",
                parentCategoryId: catMap['men'],
                childCategoryId: catMap['men-shoes'],
                price: { amount: 899900, currency: 'INR' },
                sizes: ["7", "8", "9", "10", "11"],
                colors: ["White", "Black"],
                images: [
                    // White
                    { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800", altText: "Side", color: "White" },
                    { url: "https://images.unsplash.com/photo-1600185365926-3a81fcf631a3?q=80&w=800", altText: "Front", color: "White" },
                    { url: "https://images.unsplash.com/photo-1605348532760-6753d2c43329?q=80&w=800", altText: "Top", color: "White" },
                    { url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=800", altText: "Back", color: "White" },
                    // Black
                    { url: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=800", altText: "Side", color: "Black" },
                    { url: "https://images.unsplash.com/photo-1605408499391-6368c05b6f22?q=80&w=800", altText: "Front", color: "Black" },
                    { url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800", altText: "Top", color: "Black" },
                    { url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=800", altText: "Back", color: "Black" },
                ],
                ...createVariants(["7", "8", "9", "10"], ["White", "Black"]),
                isActive: true,
                inStock: true,
                reservedStock: 0,
                isFeatured: true
            },

            // 4. Women's Tops (Beige & Black)
            {
                title: "Madewell Whisper Cotton Tee",
                slug: "madewell-whisper-cotton-tee",
                description: "Ultra-soft cotton t-shirt with a relaxed fit. A wardrobe staple.",
                parentCategoryId: catMap['women'],
                childCategoryId: catMap['women-tops'],
                price: { amount: 249900, currency: 'INR' },
                sizes: ["S", "M", "L"],
                colors: ["Beige", "Black"],
                images: [
                    // Beige
                    { url: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=800", altText: "Front", color: "Beige" },
                    { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800", altText: "Back", color: "Beige" },
                    { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800", altText: "Detail", color: "Beige" },
                    { url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=800", altText: "Folded", color: "Beige" },
                    // Black
                    { url: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?q=80&w=800", altText: "Front", color: "Black" },
                    { url: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?q=80&w=800", altText: "Back", color: "Black" },
                    { url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800", altText: "Detail", color: "Black" },
                    { url: "https://images.unsplash.com/photo-1520591799316-6b30425429aa?q=80&w=800", altText: "Folded", color: "Black" },
                ],
                ...createVariants(["S", "M", "L"], ["Beige", "Black"]),
                isActive: true,
                inStock: true,
                reservedStock: 0,
                isFeatured: false
            }
        ];

        // Insert products
        const insertedProducts = await ProductModel.insertMany(products);
        console.log(`\n✅ Seeded ${insertedProducts.length} NEW products with variants and multi-images successfully!`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

seedProductsV2();
