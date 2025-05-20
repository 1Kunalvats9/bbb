// pages/api/products/route.js (or app/api/products/route.js if using App Router)
import { NextResponse } from 'next/server';
import Inventory from '@/models/inventoryModel'; // Assuming your Mongoose model path
import connectDb from '@/lib/connectDb'; // Assuming your DB connection utility

export async function POST(req) {
    try {
        await connectDb(); // Connect to your database

        const { itemName, quantity, originalPrice, discountedPrice, barcode } = await req.json();

        // Basic validation
        if (!itemName || quantity === undefined || originalPrice === undefined || discountedPrice === undefined || !barcode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const parsedBarcode = parseInt(barcode, 10);
        if (isNaN(parsedBarcode)) {
            return NextResponse.json({ error: 'Invalid barcode format. Barcode must be a number.' }, { status: 400 });
        }
        if (quantity < 0) {
            return NextResponse.json({ error: 'Quantity cannot be negative.' }, { status: 400 });
        }
        if (originalPrice < 0 || discountedPrice < 0) {
            return NextResponse.json({ error: 'Prices cannot be negative.' }, { status: 400 });
        }

        let inventoryDoc = await Inventory.findOne({}); // Find the single inventory document

        if (!inventoryDoc) {
            // If no inventory document exists, create a new one with the first product
            inventoryDoc = await Inventory.create({
                inventory: [{
                    itemName,
                    quantity,
                    originalPrice,
                    discountedPrice,
                    barcode: parsedBarcode,
                }]
            });
            // Return the first (and only) product from the newly created inventory
            return NextResponse.json({ message: 'Product added successfully', product: inventoryDoc.inventory[0] }, { status: 201 });
        } else {
            // If inventory document exists, check if the product (by barcode) already exists
            const existingItemIndex = inventoryDoc.inventory.findIndex(item => item.barcode === parsedBarcode);

            if (existingItemIndex > -1) {
                // If product with this barcode exists, update its details
                const itemToUpdate = inventoryDoc.inventory[existingItemIndex];
                itemToUpdate.itemName = itemName;
                itemToUpdate.quantity = quantity; // Overwrite quantity, not add
                itemToUpdate.originalPrice = originalPrice;
                itemToUpdate.discountedPrice = discountedPrice;

                await inventoryDoc.save();
                return NextResponse.json({ message: 'Product updated successfully', product: itemToUpdate }, { status: 200 });
            } else {
                // If product with this barcode does not exist, add it as a new item
                const newItem = {
                    itemName,
                    quantity,
                    originalPrice,
                    discountedPrice,
                    barcode: parsedBarcode,
                };
                inventoryDoc.inventory.push(newItem);
                await inventoryDoc.save();
                return NextResponse.json({ message: 'Product added successfully', product: newItem }, { status: 201 });
            }
        }
    } catch (error) {
        console.error('Error in POST /api/products:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}