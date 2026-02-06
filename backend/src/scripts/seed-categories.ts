import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CategoryModel } from '../modules/catalog/models/category.model';


dotenv.config();

async function seed() {
    await mongoose.connect(process.env.MONGO_URI!);

    await CategoryModel.deleteMany({});

    // Top-level categories
    const men = await CategoryModel.create({
        name: 'Men',
        slug: 'men',
    });

    const women = await CategoryModel.create({
        name: 'Women',
        slug: 'women',
    });

    const kids = await CategoryModel.create({
        name: 'Kids',
        slug: 'kids',
    });

    // Child categories for each top-level category
    await CategoryModel.insertMany([
        // Men
        { name: 'T-Shirts', slug: 'men-tshirts', parentId: men.id },
        { name: 'Shirts', slug: 'men-shirts', parentId: men.id },
        { name: 'Jeans', slug: 'men-jeans', parentId: men.id },
        { name: 'Jackets', slug: 'men-jackets', parentId: men.id },

        // Women
        { name: 'Dresses', slug: 'women-dresses', parentId: women.id },
        { name: 'Tops', slug: 'women-tops', parentId: women.id },
        { name: 'Jeans', slug: 'women-jeans', parentId: women.id },
        { name: 'Jackets', slug: 'women-jackets', parentId: women.id },

        // Kids
        { name: 'T-Shirts', slug: 'kids-tshirts', parentId: kids.id },
        { name: 'Shorts', slug: 'kids-shorts', parentId: kids.id },
        { name: 'Sweatshirts', slug: 'kids-sweatshirts', parentId: kids.id },
    ]);

    console.log('Categories seeded');
    process.exit();
}

seed();
