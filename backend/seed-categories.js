const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: String,
    slug: String,
    parentId: String,
    isActive: Boolean
});

const CategoryModel = mongoose.model('Category', CategorySchema);

async function seedCategories() {
    try {
        await mongoose.connect('mongodb://localhost:27017/ecommerce');
        console.log('Connected to MongoDB');

        // Clear existing categories
        await CategoryModel.deleteMany({});
        console.log('Cleared existing categories');

        // Step 1: Create Parent Categories
        const parents = await CategoryModel.insertMany([
            { name: 'Men', slug: 'men', parentId: null, isActive: true },
            { name: 'Women', slug: 'women', parentId: null, isActive: true },
            { name: 'Kids', slug: 'kids', parentId: null, isActive: true }
        ]);

        console.log('Created parent categories:', parents.map(p => p.name));

        const menId = parents[0]._id.toString();
        const womenId = parents[1]._id.toString();
        const kidsId = parents[2]._id.toString();

        // Step 2: Create Child Categories
        const children = await CategoryModel.insertMany([
            // Men subcategories
            { name: 'Men Jeans', slug: 'men-jeans', parentId: menId, isActive: true },
            { name: 'Men Shirts', slug: 'men-shirts', parentId: menId, isActive: true },
            { name: 'Men T-Shirts', slug: 'men-tshirts', parentId: menId, isActive: true },
            { name: 'Men Jackets', slug: 'men-jackets', parentId: menId, isActive: true },
            { name: 'Men Shoes', slug: 'men-shoes', parentId: menId, isActive: true },

            // Women subcategories
            { name: 'Women Jeans', slug: 'women-jeans', parentId: womenId, isActive: true },
            { name: 'Women Dresses', slug: 'women-dresses', parentId: womenId, isActive: true },
            { name: 'Women Tops', slug: 'women-tops', parentId: womenId, isActive: true },
            { name: 'Women Shoes', slug: 'women-shoes', parentId: womenId, isActive: true },

            // Kids subcategories
            { name: 'Kids Boys', slug: 'kids-boys', parentId: kidsId, isActive: true },
            { name: 'Kids Girls', slug: 'kids-girls', parentId: kidsId, isActive: true }
        ]);

        console.log('Created child categories:', children.map(c => c.name));

        // Display hierarchy
        console.log('\n=== CATEGORY HIERARCHY ===');
        for (const parent of parents) {
            console.log(`\n${parent.name} (${parent._id})`);
            const childCats = children.filter(c => c.parentId === parent._id.toString());
            childCats.forEach(child => {
                console.log(`  └─ ${child.name} (${child._id})`);
            });
        }

        console.log('\n✅ Categories seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

seedCategories();
