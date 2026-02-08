import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { CategoryModel } from '../modules/catalog/models/category.model';
import { ProductModel } from '../modules/catalog/models/product.model';

const categories = [
    {
        name: 'Men',
        slug: 'men',
        parentCategory: null,
        description: 'Fashion for men',
        isActive: true,
        displayOrder: 1,
    },
    {
        name: 'Women',
        slug: 'women',
        parentCategory: null,
        description: 'Fashion for women',
        isActive: true,
        displayOrder: 2,
    },
    {
        name: 'Kids',
        slug: 'kids',
        parentCategory: null,
        description: 'Fashion for kids',
        isActive: true,
        displayOrder: 3,
    },
];

const subcategories = [
    // Men subcategories
    { name: 'T-Shirts', slug: 'men-tshirts', parent: 'men', description: 'Men\'s T-Shirts', displayOrder: 1 },
    { name: 'Shirts', slug: 'men-shirts', parent: 'men', description: 'Men\'s Shirts', displayOrder: 2 },
    { name: 'Jeans', slug: 'men-jeans', parent: 'men', description: 'Men\'s Jeans', displayOrder: 3 },
    { name: 'Jackets', slug: 'men-jackets', parent: 'men', description: 'Men\'s Jackets', displayOrder: 4 },

    // Women subcategories
    { name: 'Tops', slug: 'women-tops', parent: 'women', description: 'Women\'s Tops', displayOrder: 1 },
    { name: 'Dresses', slug: 'women-dresses', parent: 'women', description: 'Women\'s Dresses', displayOrder: 2 },
    { name: 'Jeans', slug: 'women-jeans', parent: 'women', description: 'Women\'s Jeans', displayOrder: 3 },
    { name: 'Jackets', slug: 'women-jackets', parent: 'women', description: 'Women\'s Jackets', displayOrder: 4 },

    // Kids subcategories
    { name: 'T-Shirts', slug: 'kids-tshirts', parent: 'kids', description: 'Kids\' T-Shirts', displayOrder: 1 },
    { name: 'Dresses', slug: 'kids-dresses', parent: 'kids', description: 'Kids\' Dresses', displayOrder: 2 },
    { name: 'Jeans', slug: 'kids-jeans', parent: 'kids', description: 'Kids\' Jeans', displayOrder: 3 },
];

const sampleProducts = [
    // Men's T-Shirts
    {
        title: 'Classic Cotton T-Shirt',
        slug: 'classic-cotton-tshirt-men',
        description: 'Comfortable 100% cotton t-shirt perfect for everyday wear. Made with premium quality fabric.',
        parentCategory: 'men',
        category: 'men-tshirts',
        price: { amount: 79900, currency: 'INR' as const }, // ₹799
        images: [
            { url: 'https://placehold.co/600x800/000000/FFFFFF/png?text=Black+T-Shirt', altText: 'Black T-Shirt', color: 'Black' },
            { url: 'https://placehold.co/600x800/FFFFFF/000000/png?text=White+T-Shirt', altText: 'White T-Shirt', color: 'White' },
        ],
        variants: [
            { size: 'S', color: 'Black', stock: 50, reservedStock: 0, availableStock: 50, sku: 'MTS-BLK-S' },
            { size: 'M', color: 'Black', stock: 75, reservedStock: 0, availableStock: 75, sku: 'MTS-BLK-M' },
            { size: 'L', color: 'Black', stock: 60, reservedStock: 0, availableStock: 60, sku: 'MTS-BLK-L' },
            { size: 'S', color: 'White', stock: 45, reservedStock: 0, availableStock: 45, sku: 'MTS-WHT-S' },
            { size: 'M', color: 'White', stock: 80, reservedStock: 0, availableStock: 80, sku: 'MTS-WHT-M' },
            { size: 'L', color: 'White', stock: 55, reservedStock: 0, availableStock: 55, sku: 'MTS-WHT-L' },
        ],
        isActive: true,
    },
    {
        title: 'Graphic Print T-Shirt',
        slug: 'graphic-print-tshirt-men',
        description: 'Trendy graphic print t-shirt with modern design. Perfect for casual outings and weekend wear.',
        parentCategory: 'men',
        category: 'men-tshirts',
        price: { amount: 99900, currency: 'INR' as const }, // ₹999
        images: [
            { url: 'https://placehold.co/600x800/000080/FFFFFF/png?text=Navy+Graphic+Tee', altText: 'Navy Blue Graphic T-Shirt', color: 'Navy Blue' },
        ],
        variants: [
            { size: 'M', color: 'Navy Blue', stock: 40, reservedStock: 0, availableStock: 40, sku: 'MGT-NVY-M' },
            { size: 'L', color: 'Navy Blue', stock: 35, reservedStock: 0, availableStock: 35, sku: 'MGT-NVY-L' },
            { size: 'XL', color: 'Navy Blue', stock: 30, reservedStock: 0, availableStock: 30, sku: 'MGT-NVY-XL' },
        ],
        isActive: true,
    },

    // Women's Tops
    {
        title: 'Floral Print Top',
        slug: 'floral-print-top-women',
        description: 'Beautiful floral print top perfect for summer days. Lightweight and breathable fabric for all-day comfort.',
        parentCategory: 'women',
        category: 'women-tops',
        price: { amount: 129900, currency: 'INR' as const }, // ₹1299
        images: [
            { url: 'https://placehold.co/600x800/FFC0CB/000000/png?text=Pink+Floral+Top', altText: 'Pink Floral Top', color: 'Pink' },
            { url: 'https://placehold.co/600x800/0000FF/FFFFFF/png?text=Blue+Floral+Top', altText: 'Blue Floral Top', color: 'Blue' },
        ],
        variants: [
            { size: 'S', color: 'Pink', stock: 30, reservedStock: 0, availableStock: 30, sku: 'WFT-PNK-S' },
            { size: 'M', color: 'Pink', stock: 45, reservedStock: 0, availableStock: 45, sku: 'WFT-PNK-M' },
            { size: 'L', color: 'Pink', stock: 25, reservedStock: 0, availableStock: 25, sku: 'WFT-PNK-L' },
            { size: 'S', color: 'Blue', stock: 35, reservedStock: 0, availableStock: 35, sku: 'WFT-BLU-S' },
            { size: 'M', color: 'Blue', stock: 50, reservedStock: 0, availableStock: 50, sku: 'WFT-BLU-M' },
        ],
        isActive: true,
    },
    {
        title: 'Elegant Silk Top',
        slug: 'elegant-silk-top-women',
        description: 'Premium silk top for formal occasions. Luxurious feel with elegant drape and sophisticated style.',
        parentCategory: 'women',
        category: 'women-tops',
        price: { amount: 199900, currency: 'INR' as const }, // ₹1999
        images: [
            { url: 'https://placehold.co/600x800/FFFDD0/000000/png?text=Cream+Silk+Top', altText: 'Cream Silk Top', color: 'Cream' },
        ],
        variants: [
            { size: 'S', color: 'Cream', stock: 20, reservedStock: 0, availableStock: 20, sku: 'WST-CRM-S' },
            { size: 'M', color: 'Cream', stock: 25, reservedStock: 0, availableStock: 25, sku: 'WST-CRM-M' },
            { size: 'L', color: 'Cream', stock: 15, reservedStock: 0, availableStock: 15, sku: 'WST-CRM-L' },
        ],
        isActive: true,
    },

    // Women's Dresses
    {
        title: 'Summer Maxi Dress',
        slug: 'summer-maxi-dress-women',
        description: 'Flowing maxi dress perfect for beach days and summer evenings. Comfortable and stylish for any occasion.',
        parentCategory: 'women',
        category: 'women-dresses',
        price: { amount: 249900, currency: 'INR' as const }, // ₹2499
        images: [
            { url: 'https://placehold.co/600x800/FF7F50/FFFFFF/png?text=Coral+Maxi+Dress', altText: 'Coral Maxi Dress', color: 'Coral' },
        ],
        variants: [
            { size: 'S', color: 'Coral', stock: 25, reservedStock: 0, availableStock: 25, sku: 'WMD-CRL-S' },
            { size: 'M', color: 'Coral', stock: 30, reservedStock: 0, availableStock: 30, sku: 'WMD-CRL-M' },
            { size: 'L', color: 'Coral', stock: 20, reservedStock: 0, availableStock: 20, sku: 'WMD-CRL-L' },
        ],
        isActive: true,
    },

    // Men's Shirts
    {
        title: 'Formal White Shirt',
        slug: 'formal-white-shirt-men',
        description: 'Classic white formal shirt for office wear. Crisp, professional look with comfortable fit for all-day wear.',
        parentCategory: 'men',
        category: 'men-shirts',
        price: { amount: 149900, currency: 'INR' as const }, // ₹1499
        images: [
            { url: 'https://placehold.co/600x800/FFFFFF/000000/png?text=White+Formal+Shirt', altText: 'White Formal Shirt', color: 'White' },
        ],
        variants: [
            { size: 'M', color: 'White', stock: 40, reservedStock: 0, availableStock: 40, sku: 'MFS-WHT-M' },
            { size: 'L', color: 'White', stock: 45, reservedStock: 0, availableStock: 45, sku: 'MFS-WHT-L' },
            { size: 'XL', color: 'White', stock: 35, reservedStock: 0, availableStock: 35, sku: 'MFS-WHT-XL' },
        ],
        isActive: true,
    },

    // Kids' T-Shirts
    {
        title: 'Kids Cartoon T-Shirt',
        slug: 'kids-cartoon-tshirt',
        description: 'Fun cartoon print t-shirt for kids. Soft, comfortable fabric perfect for active play and everyday wear.',
        parentCategory: 'kids',
        category: 'kids-tshirts',
        price: { amount: 59900, currency: 'INR' as const }, // ₹599
        images: [
            { url: 'https://placehold.co/600x800/FF0000/FFFFFF/png?text=Red+Cartoon+Tee', altText: 'Red Cartoon T-Shirt', color: 'Red' },
            { url: 'https://placehold.co/600x800/0000FF/FFFFFF/png?text=Blue+Cartoon+Tee', altText: 'Blue Cartoon T-Shirt', color: 'Blue' },
        ],
        variants: [
            { size: '2-3Y', color: 'Red', stock: 30, reservedStock: 0, availableStock: 30, sku: 'KCT-RED-2' },
            { size: '4-5Y', color: 'Red', stock: 35, reservedStock: 0, availableStock: 35, sku: 'KCT-RED-4' },
            { size: '6-7Y', color: 'Red', stock: 25, reservedStock: 0, availableStock: 25, sku: 'KCT-RED-6' },
            { size: '2-3Y', color: 'Blue', stock: 28, reservedStock: 0, availableStock: 28, sku: 'KCT-BLU-2' },
            { size: '4-5Y', color: 'Blue', stock: 32, reservedStock: 0, availableStock: 32, sku: 'KCT-BLU-4' },
        ],
        isActive: true,
    },
];

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seed...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🗑️  Clearing existing categories and products...');
        await CategoryModel.deleteMany({});
        await ProductModel.deleteMany({});
        console.log('✅ Cleared existing data');

        // Create parent categories
        console.log('📁 Creating parent categories...');
        const createdCategories = await CategoryModel.insertMany(categories);
        console.log(`✅ Created ${createdCategories.length} parent categories`);

        // Create subcategories with parent references
        console.log('📂 Creating subcategories...');
        const subcategoriesWithParents = await Promise.all(
            subcategories.map(async (subcat) => {
                const parent = createdCategories.find(c => c.slug === subcat.parent);
                return {
                    name: subcat.name,
                    slug: subcat.slug,
                    parentCategory: parent?._id,
                    description: subcat.description,
                    isActive: true,
                    displayOrder: subcat.displayOrder,
                };
            })
        );
        const createdSubcategories = await CategoryModel.insertMany(subcategoriesWithParents);
        console.log(`✅ Created ${createdSubcategories.length} subcategories`);

        // Create products
        console.log('🛍️  Creating products...');
        const productsWithCategories = await Promise.all(
            sampleProducts.map(async (product: any) => {
                const parentCat = createdCategories.find(c => c.slug === product.parentCategory);
                const subCat = createdSubcategories.find(c => c.slug === product.category);

                return {
                    title: product.title,
                    slug: product.slug,
                    description: product.description,
                    parentCategoryId: parentCat?._id,
                    childCategoryId: subCat?._id,
                    price: product.price,
                    images: product.images,
                    variants: product.variants,
                    isActive: product.isActive,
                };
            })
        );
        const createdProducts = await ProductModel.insertMany(productsWithCategories);
        console.log(`✅ Created ${createdProducts.length} products`);

        console.log('\n🎉 Database seeded successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`   - ${createdCategories.length} parent categories`);
        console.log(`   - ${createdSubcategories.length} subcategories`);
        console.log(`   - ${createdProducts.length} products`);
        console.log(`\n✨ Your database is ready to use!`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
