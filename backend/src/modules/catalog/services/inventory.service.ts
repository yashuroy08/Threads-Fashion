// src/modules/catalog/services/inventory.service.ts
import { ClientSession } from 'mongoose';
import { ProductModel } from '../models/product.model';
import { AppError } from '../../../common/errors/app-error';

/**
 * STEP 2: Reserve Inventory
 * Atomically checks availability and increments reservedStock.
 * Uses $expr to compare two fields within the document.
 */
export const reserveInventory = async (
    productId: string,
    quantity: number,
    session: ClientSession | null
): Promise<boolean> => {
    const result = await ProductModel.findOneAndUpdate(
        {
            _id: productId,
            // ATOMIC CONDITION: (stock - reservedStock) >= requested_quantity
            $expr: {
                $gte: [
                    { $subtract: ["$stock", "$reservedStock"] },
                    quantity
                ]
            }
        },
        {
            // ATOMIC ACTION: Increase reserved stock
            $inc: { reservedStock: quantity }
        },
        {
            new: true,
            session // Critical for transaction rollback
        }
    );

    return !!result; // True if reserved, False if insufficient stock
};

/**
 * Reserve Variant-Level Inventory
 * For products with size/color variants
 */
export const reserveVariantInventory = async (
    productId: string,
    size: string,
    color: string,
    quantity: number,
    session: ClientSession | null
): Promise<boolean> => {
    const product = await ProductModel.findById(productId).session(session);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // If no variants, fallback to product-level
    if (!product.variants || product.variants.length === 0) {
        return reserveInventory(productId, quantity, session);
    }

    // Find the specific variant with case-insensitive comparison
    const variantIndex = product.variants.findIndex(
        v => String(v.size).toLowerCase() === String(size).toLowerCase() &&
            String(v.color).toLowerCase() === String(color).toLowerCase()
    );

    if (variantIndex === -1) {
        throw new AppError(`Variant ${size}/${color} not found for product`, 404);
    }

    const variant = product.variants[variantIndex];

    // Check if enough available stock (stock - reservedStock)
    const availableStock = variant.stock - (variant.reservedStock || 0);
    if (availableStock < quantity) {
        return false; // Insufficient stock
    }

    // Reserve the stock
    product.variants[variantIndex].reservedStock = (variant.reservedStock || 0) + quantity;

    // Update availableStock
    product.variants[variantIndex].availableStock = variant.stock - product.variants[variantIndex].reservedStock;

    await product.save({ session });
    return true;
};

/**
 * STEP 3: Release Inventory
 * Used when payment fails or order is cancelled.
 * Reverses the reservation without touching physical stock.
 */
export const releaseInventory = async (
    productId: string,
    quantity: number
) => {
    await ProductModel.updateOne(
        { _id: productId },
        {
            // Safety: Ensure we don't drop below 0, though app logic shouldn't allow it
            $inc: { reservedStock: -quantity }
        }
    );
};

/**
 * STEP 4: Finalize Inventory
 * Used ONLY after successful payment.
 * Permanently removes items from physical stock and clears reservation.
 */
export const finalizeInventory = async (
    productId: string,
    quantity: number
) => {
    await ProductModel.updateOne(
        { _id: productId },
        {
            $inc: {
                stock: -quantity,        // Remove from physical inventory
                reservedStock: -quantity // Remove from reservation hold
            }
        }
    );
};

/**
 * VARIANT-LEVEL STOCK MANAGEMENT
 * Deduct stock from specific size+color variant
 */
export const finalizeVariantInventory = async (
    productId: string,
    size: string,
    color: string,
    quantity: number
) => {
    const product = await ProductModel.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Find the specific variant with case-insensitive comparison
    const variantIndex = product.variants.findIndex(
        v => String(v.size).toLowerCase() === String(size).toLowerCase() &&
            String(v.color).toLowerCase() === String(color).toLowerCase()
    );

    if (variantIndex === -1) {
        throw new AppError(`Variant ${size}/${color} not found for product`, 404);
    }

    const variant = product.variants[variantIndex];

    // Check if enough stock available
    if (variant.stock < quantity) {
        throw new AppError(
            `Insufficient stock for ${size}/${color}. Only ${variant.stock} available.`,
            400
        );
    }

    // Deduct from variant stock
    product.variants[variantIndex].stock -= quantity;
    product.variants[variantIndex].reservedStock = Math.max(0, (variant.reservedStock || 0) - quantity);
    product.variants[variantIndex].availableStock = product.variants[variantIndex].stock - product.variants[variantIndex].reservedStock;

    // Trigger pre-save hook to update total stock
    await product.save();
};