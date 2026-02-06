const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: String,
    slug: String,
    parentId: String
});

const ProductSchema = new mongoose.Schema({
    title: String,
    slug: String,
    description: String,
    parentCategoryId: String,
    childCategoryId: String,
    price: {
        amount: Number,
        currency: String
    },
    images: [{
        url: String,
        altText: String
    }],
    isActive: Boolean,
    inStock: Boolean,
    stock: Number,
    reservedStock: Number
});

const CategoryModel = mongoose.model('Category', CategorySchema);
const ProductModel = mongoose.model('Product', ProductSchema);

async function seedProducts() {
    try {
        await mongoose.connect('mongodb://localhost:27017/ecommerce');
        console.log('Connected to MongoDB');

        // Fetch categories
        const categories = await CategoryModel.find({});
        const catMap = {};
        categories.forEach(cat => {
            catMap[cat.slug] = cat._id.toString();
        });

        // Clear existing products
        await ProductModel.deleteMany({});
        console.log('Cleared existing products');

        // Real Products Data
        const products = [
            // MEN JEANS
            {
                title: "Levi's 511 Slim Fit Jeans",
                slug: "levis-511-slim-fit-jeans",
                description: "The Levi's 511 Slim Fit Jeans sit below the waist with a slim fit from hip to ankle. Made from premium stretch denim for all-day comfort. Features classic 5-pocket styling and the iconic Levi's red tab.",
                parentCategoryId: catMap['men'],
                childCategoryId: catMap['men-jeans'],
                price: { amount: 449900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800',
                    altText: "Levi's 511 Slim Fit Jeans"
                }],
                isActive: true,
                inStock: true,
                stock: 50,
                reservedStock: 0
            },
            {
                title: "Wrangler Cowboy Cut Original Fit Jeans",
                slug: "wrangler-cowboy-cut-jeans",
                description: "Authentic cowboy-cut jeans with a relaxed fit through the seat and thigh. Made from 100% cotton denim with reinforced stitching for durability. Perfect for everyday wear with a classic Western style.",
                parentCategoryId: catMap['men'],
                childCategoryId: catMap['men-jeans'],
                price: { amount: 349900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1475178626620-a4d074967452?auto=format&fit=crop&q=80&w=800',
                    altText: 'Wrangler Cowboy Cut Jeans'
                }],
                isActive: true,
                inStock: true,
                stock: 40,
                reservedStock: 0
            },
            {
                title: "Diesel Sleenker Skinny Jeans",
                slug: "diesel-sleenker-skinny-jeans",
                description: "Ultra-slim fit jeans with a modern skinny leg silhouette. Crafted from Italian stretch denim with a dark wash finish. Features signature Diesel hardware and unique distressing details for an edgy look.",
                parentCategoryId: catMap['men'],
                childCategoryId: catMap['men-jeans'],
                price: { amount: 899900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800',
                    altText: 'Diesel Sleenker Skinny Jeans'
                }],
                isActive: true,
                inStock: true,
                stock: 30,
                reservedStock: 0
            },

            // MEN SHIRTS
            {
                title: "Brooks Brothers Oxford Shirt",
                slug: "brooks-brothers-oxford-shirt",
                description: "Classic button-down Oxford shirt in premium cotton. Features a regular fit with a button-down collar and chest pocket. Perfect for business casual or smart-casual occasions. Machine washable and wrinkle-resistant.",
                parentCategoryId: catMap['men'],
                childCategoryId: catMap['men-shirts'],
                price: { amount: 549900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800',
                    altText: 'Brooks Brothers Oxford Shirt'
                }],
                isActive: true,
                inStock: true,
                stock: 45,
                reservedStock: 0
            },
            {
                title: "Ralph Lauren Classic Fit Shirt",
                slug: "ralph-lauren-classic-fit-shirt",
                description: "Timeless dress shirt with a classic fit and spread collar. Made from 100% cotton poplin with mother-of-pearl buttons. Features the iconic Ralph Lauren pony logo. Ideal for formal and semi-formal events.",
                parentCategoryId: catMap['men'],
                childCategoryId: catMap['men-shirts'],
                price: { amount: 649900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800',
                    altText: 'Ralph Lauren Classic Fit Shirt'
                }],
                isActive: true,
                inStock: true,
                stock: 35,
                reservedStock: 0
            },
            {
                title: "Tommy Hilfiger Slim Fit Shirt",
                slug: "tommy-hilfiger-slim-fit-shirt",
                description: "Modern slim-fit shirt with a tailored silhouette. Crafted from stretch cotton for comfort and mobility. Features signature Tommy Hilfiger flag logo and contrasting inner collar. Perfect for contemporary styling.",
                parentCategoryId: catMap['men'],
                childCategoryId: catMap['men-shirts'],
                price: { amount: 499900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&q=80&w=800',
                    altText: 'Tommy Hilfiger Slim Fit Shirt'
                }],
                isActive: true,
                inStock: true,
                stock: 40,
                reservedStock: 0
            },

            // MEN T-SHIRTS
            {
                title: "Nike Dri-FIT Performance T-Shirt",
                slug: "nike-dri-fit-tshirt",
                description: "Athletic performance t-shirt with Nike's signature Dri-FIT technology that wicks away sweat. Lightweight and breathable fabric with a comfortable crew neck. Features the iconic Nike swoosh logo. Perfect for workouts and sports.",
                parentCategoryId: catMap['men'],
                childCategoryId: catMap['men-tshirts'],
                price: { amount: 199900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
                    altText: 'Nike Dri-FIT T-Shirt'
                }],
                isActive: true,
                inStock: true,
                stock: 60,
                reservedStock: 0
            },
            {
                title: "Adidas Originals Trefoil T-Shirt",
                slug: "adidas-trefoil-tshirt",
                description: "Classic streetwear t-shirt featuring the iconic Adidas trefoil logo. Made from soft cotton jersey with a relaxed fit. Ribbed crew neck and short sleeves. A timeless piece for casual everyday wear.",
                parentCategoryId: catMap['men'],
                childCategoryId: catMap['men-tshirts'],
                price: { amount: 179900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',
                    altText: 'Adidas Trefoil T-Shirt'
                }],
                isActive: true,
                inStock: true,
                stock: 55,
                reservedStock: 0
            },

            // MEN JACKETS
            {
                title: "The North Face Thermoball Jacket",
                slug: "north-face-thermoball-jacket",
                description: "Lightweight insulated jacket with ThermoBall synthetic insulation that mimics down. Water-resistant shell with elastic-bound cuffs and hem. Packable design with zippered hand pockets. Ideal for cold weather adventures.",
                parentCategoryId: catMap['men'],
                childCategoryId: catMap['men-jackets'],
                price: { amount: 1299900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800',
                    altText: 'The North Face Thermoball Jacket'
                }],
                isActive: true,
                inStock: true,
                stock: 25,
                reservedStock: 0
            },
            {
                title: "Levi's Trucker Denim Jacket",
                slug: "levis-trucker-denim-jacket",
                description: "Iconic denim jacket with a classic trucker silhouette. Made from authentic Levi's denim with signature copper rivets and button closure. Features two chest pockets and side hand pockets. A wardrobe essential that never goes out of style.",
                parentCategoryId: catMap['men'],
                childCategoryId: catMap['men-jackets'],
                price: { amount: 599900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800',
                    altText: "Levi's Trucker Jacket"
                }],
                isActive: true,
                inStock: true,
                stock: 30,
                reservedStock: 0
            },

            // MEN SHOES
            {
                title: "Nike Air Max 90",
                slug: "nike-air-max-90",
                description: "Legendary running shoe with visible Air cushioning in the heel. Features a mix of leather and synthetic materials with classic waffle outsole. Iconic design that combines retro style with modern comfort. Perfect for everyday wear.",
                parentCategoryId: catMap['men'],
                childCategoryId: catMap['men-shoes'],
                price: { amount: 899900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
                    altText: 'Nike Air Max 90'
                }],
                isActive: true,
                inStock: true,
                stock: 40,
                reservedStock: 0
            },
            {
                title: "Clarks Desert Boot",
                slug: "clarks-desert-boot",
                description: "Classic ankle boot with premium suede upper and crepe rubber sole. Features two-eyelet lacing and a timeless chukka silhouette. Handcrafted construction for superior comfort and durability. A versatile boot for smart-casual styling.",
                parentCategoryId: catMap['men'],
                childCategoryId: catMap['men-shoes'],
                price: { amount: 749900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&q=80&w=800',
                    altText: 'Clarks Desert Boot'
                }],
                isActive: true,
                inStock: true,
                stock: 35,
                reservedStock: 0
            },

            // WOMEN JEANS
            {
                title: "Levi's 721 High Rise Skinny Jeans",
                slug: "levis-721-high-rise-skinny-jeans",
                description: "High-waisted skinny jeans that hug your curves from hip to ankle. Made from premium stretch denim for a flattering fit. Features classic 5-pocket styling and the iconic Levi's red tab. Perfect for creating a sleek silhouette.",
                parentCategoryId: catMap['women'],
                childCategoryId: catMap['women-jeans'],
                price: { amount: 449900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&q=80&w=800',
                    altText: "Levi's 721 High Rise Skinny Jeans"
                }],
                isActive: true,
                inStock: true,
                stock: 50,
                reservedStock: 0
            },
            {
                title: "AG Jeans Farrah Skinny Ankle",
                slug: "ag-jeans-farrah-skinny-ankle",
                description: "Premium skinny ankle jeans with a high-rise fit and cropped length. Crafted from soft stretch denim with excellent recovery. Features a clean hem and subtle whiskering. Designed in Los Angeles for a modern, sophisticated look.",
                parentCategoryId: catMap['women'],
                childCategoryId: catMap['women-jeans'],
                price: { amount: 1299900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&q=80&w=800',
                    altText: 'AG Jeans Farrah Skinny Ankle'
                }],
                isActive: true,
                inStock: true,
                stock: 30,
                reservedStock: 0
            },

            // WOMEN DRESSES
            {
                title: "Zara Midi Wrap Dress",
                slug: "zara-midi-wrap-dress",
                description: "Elegant midi-length wrap dress with a flattering V-neckline and tie waist. Made from flowing fabric with a feminine silhouette. Features short sleeves and a flared skirt. Perfect for office wear or special occasions.",
                parentCategoryId: catMap['women'],
                childCategoryId: catMap['women-dresses'],
                price: { amount: 399900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800',
                    altText: 'Zara Midi Wrap Dress'
                }],
                isActive: true,
                inStock: true,
                stock: 40,
                reservedStock: 0
            },
            {
                title: "H&M Floral Maxi Dress",
                slug: "hm-floral-maxi-dress",
                description: "Romantic maxi dress with a beautiful floral print. Features a fitted bodice with adjustable straps and a flowing skirt. Made from lightweight fabric perfect for warm weather. Ideal for summer events and beach vacations.",
                parentCategoryId: catMap['women'],
                childCategoryId: catMap['women-dresses'],
                price: { amount: 299900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800',
                    altText: 'H&M Floral Maxi Dress'
                }],
                isActive: true,
                inStock: true,
                stock: 45,
                reservedStock: 0
            },
            {
                title: "Forever 21 Bodycon Dress",
                slug: "forever-21-bodycon-dress",
                description: "Sleek bodycon dress that hugs your curves in all the right places. Made from stretchy ribbed fabric with a crew neck and short sleeves. Mini length design perfect for nights out. Available in classic black.",
                parentCategoryId: catMap['women'],
                childCategoryId: catMap['women-dresses'],
                price: { amount: 199900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800',
                    altText: 'Forever 21 Bodycon Dress'
                }],
                isActive: true,
                inStock: true,
                stock: 50,
                reservedStock: 0
            },

            // WOMEN TOPS
            {
                title: "Madewell Whisper Cotton Tee",
                slug: "madewell-whisper-cotton-tee",
                description: "Ultra-soft cotton t-shirt with a relaxed fit and crew neck. Made from Madewell's signature Whisper Cotton that gets softer with every wash. Features a slightly longer length and side slits. A wardrobe staple for everyday wear.",
                parentCategoryId: catMap['women'],
                childCategoryId: catMap['women-tops'],
                price: { amount: 249900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=800',
                    altText: 'Madewell Whisper Cotton Tee'
                }],
                isActive: true,
                inStock: true,
                stock: 55,
                reservedStock: 0
            },
            {
                title: "Everlane Silk Blouse",
                slug: "everlane-silk-blouse",
                description: "Luxurious silk blouse with a relaxed fit and V-neckline. Made from 100% silk with a beautiful drape. Features long sleeves with button cuffs and a curved hem. Perfect for dressing up or down with effortless elegance.",
                parentCategoryId: catMap['women'],
                childCategoryId: catMap['women-tops'],
                price: { amount: 799900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?auto=format&fit=crop&q=80&w=800',
                    altText: 'Everlane Silk Blouse'
                }],
                isActive: true,
                inStock: true,
                stock: 30,
                reservedStock: 0
            },

            // WOMEN SHOES
            {
                title: "Steve Madden Daisie Pumps",
                slug: "steve-madden-daisie-pumps",
                description: "Classic pointed-toe pumps with a sleek stiletto heel. Made from smooth synthetic leather with a cushioned insole. Features a timeless silhouette that pairs perfectly with dresses and trousers. Essential for any professional wardrobe.",
                parentCategoryId: catMap['women'],
                childCategoryId: catMap['women-shoes'],
                price: { amount: 549900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800',
                    altText: 'Steve Madden Daisie Pumps'
                }],
                isActive: true,
                inStock: true,
                stock: 40,
                reservedStock: 0
            },
            {
                title: "Converse Chuck Taylor All Star",
                slug: "converse-chuck-taylor-womens",
                description: "Iconic canvas sneakers with a timeless high-top silhouette. Features the classic Chuck Taylor ankle patch and rubber toe cap. Durable canvas upper with a cushioned footbed. A versatile shoe that goes with everything.",
                parentCategoryId: catMap['women'],
                childCategoryId: catMap['women-shoes'],
                price: { amount: 449900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&q=80&w=800',
                    altText: 'Converse Chuck Taylor All Star'
                }],
                isActive: true,
                inStock: true,
                stock: 50,
                reservedStock: 0
            },

            // KIDS BOYS
            {
                title: "Gap Kids Graphic T-Shirt",
                slug: "gap-kids-graphic-tshirt-boys",
                description: "Fun graphic t-shirt for boys with colorful prints. Made from soft 100% cotton that's gentle on sensitive skin. Features a crew neck and short sleeves. Machine washable and durable for active play. Available in multiple designs.",
                parentCategoryId: catMap['kids'],
                childCategoryId: catMap['kids-boys'],
                price: { amount: 129900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=800',
                    altText: 'Gap Kids Graphic T-Shirt'
                }],
                isActive: true,
                inStock: true,
                stock: 60,
                reservedStock: 0
            },
            {
                title: "Carter's Boys Jogger Pants",
                slug: "carters-boys-jogger-pants",
                description: "Comfortable jogger pants with an elastic waistband and cuffs. Made from soft fleece fabric perfect for everyday wear. Features side pockets and a relaxed fit. Easy to pull on and off for independent dressing.",
                parentCategoryId: catMap['kids'],
                childCategoryId: catMap['kids-boys'],
                price: { amount: 179900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&q=80&w=800',
                    altText: "Carter's Boys Jogger Pants"
                }],
                isActive: true,
                inStock: true,
                stock: 50,
                reservedStock: 0
            },

            // KIDS GIRLS
            {
                title: "Gymboree Girls Floral Dress",
                slug: "gymboree-girls-floral-dress",
                description: "Adorable floral dress with a twirl-worthy skirt. Made from soft cotton with a comfortable fit. Features a Peter Pan collar and back zipper. Perfect for parties, playdates, and special occasions. Machine washable for easy care.",
                parentCategoryId: catMap['kids'],
                childCategoryId: catMap['kids-girls'],
                price: { amount: 249900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=800',
                    altText: 'Gymboree Girls Floral Dress'
                }],
                isActive: true,
                inStock: true,
                stock: 45,
                reservedStock: 0
            },
            {
                title: "Old Navy Girls Leggings",
                slug: "old-navy-girls-leggings",
                description: "Stretchy leggings with a comfortable elastic waistband. Made from soft cotton-blend fabric that moves with her. Features a full-length design perfect for layering. Available in solid colors and fun prints. Great for school and play.",
                parentCategoryId: catMap['kids'],
                childCategoryId: catMap['kids-girls'],
                price: { amount: 149900, currency: 'INR' },
                images: [{
                    url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
                    altText: 'Old Navy Girls Leggings'
                }],
                isActive: true,
                inStock: true,
                stock: 55,
                reservedStock: 0
            }
        ];

        // Insert products
        const insertedProducts = await ProductModel.insertMany(products);
        console.log(`\n✅ Seeded ${insertedProducts.length} products successfully!`);

        // Display summary
        console.log('\n=== PRODUCT SUMMARY ===');
        const parentCats = await CategoryModel.find({ parentId: null });
        for (const parent of parentCats) {
            const childCats = await CategoryModel.find({ parentId: parent._id.toString() });
            console.log(`\n${parent.name}:`);
            for (const child of childCats) {
                const count = insertedProducts.filter(p => p.childCategoryId === child._id.toString()).length;
                console.log(`  ${child.name}: ${count} products`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

seedProducts();
