import { NextResponse } from 'next/server';
import Inventory from '@/models/inventoryModel';
import connectDb from '@/lib/connectDb';

// Helper to parse numbers safely
const parseNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num; // Return undefined if not a valid number
};

export async function PUT(req, { params }) {
    try {
        await connectDb();

        const { itemName, quantity, originalPrice, discountedPrice, barcode } = await req.json();

        // Safely parse incoming numbers
        const parsedQuantity = parseNumber(quantity);
        const parsedOriginalPrice = parseNumber(originalPrice);
        const parsedDiscountedPrice = parseNumber(discountedPrice);
        const parsedBarcode = parseInt(barcode, 10); // Barcode should remain an integer

        // Basic validation for existence and type
        if (!itemName || parsedQuantity === undefined || parsedOriginalPrice === undefined || parsedDiscountedPrice === undefined || isNaN(parsedBarcode)) {
            return NextResponse.json({ error: 'Missing or invalid required fields (item name, quantity, prices, or barcode).' }, { status: 400 });
        }
        // Ensure barcode is a whole number (EAN-13, UPC are integers)
        if (parsedBarcode % 1 !== 0) {
            return NextResponse.json({ error: 'Invalid barcode format. Barcode must be a whole number.' }, { status: 400 });
        }

        if (parsedQuantity < 0) {
            return NextResponse.json({ error: 'Quantity cannot be negative.' }, { status: 400 });
        }
        if (parsedOriginalPrice < 0 || parsedDiscountedPrice < 0) {
            return NextResponse.json({ error: 'Prices cannot be negative.' }, { status: 400 });
        }

        const inventoryDoc = await Inventory.findOne({});

        if (!inventoryDoc) {
            return NextResponse.json({ error: 'Global inventory document not found. Please initialize inventory.' }, { status: 404 });
        }

        const existingItemIndex = inventoryDoc.inventory.findIndex(item => item.barcode === parsedBarcode);

        if (existingItemIndex > -1) {
            // Product exists, update it
            const itemToUpdate = inventoryDoc.inventory[existingItemIndex];
            
            // NOTE: The frontend's `handleUpdateProduct` sends the *final* calculated quantity,
            // so we should assign it directly, not add to it.
            itemToUpdate.itemName = itemName;
            itemToUpdate.quantity = parsedQuantity; 
            itemToUpdate.originalPrice = parsedOriginalPrice;
            itemToUpdate.discountedPrice = parsedDiscountedPrice;

            if (itemToUpdate.quantity < 0) {
                return NextResponse.json({ error: 'Quantity cannot be negative after update.' }, { status: 400 });
            }

            await inventoryDoc.save();
            return NextResponse.json({ message: 'Product updated successfully', product: itemToUpdate }, { status: 200 });
        } else {
            // If the PUT request is for an item not found, this implies a logic error in frontend
            // or that PUT is being used as an upsert. The current frontend calls PUT only if found.
            // If you intend PUT to also create, move the newItem creation here.
            const newItem = { // This block handles adding a *new* item if it doesn't exist
                itemName,
                quantity: parsedQuantity,
                originalPrice: parsedOriginalPrice,
                discountedPrice: parsedDiscountedPrice,
                barcode: parsedBarcode,
            };
            inventoryDoc.inventory.push(newItem);
            await inventoryDoc.save();
            return NextResponse.json({ message: 'Product added successfully (via PUT)', product: newItem }, { status: 201 });
        }
    } catch (error) {
        console.error('Error in PUT /api/products:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}

export async function POST(req) {
      try {
        await connectDb();

        const { itemName, quantity, originalPrice, discountedPrice, barcode } = await req.json();

        // Safely parse incoming numbers
        const parsedQuantity = parseNumber(quantity);
        const parsedOriginalPrice = parseNumber(originalPrice);
        const parsedDiscountedPrice = parseNumber(discountedPrice);
        const parsedBarcode = parseInt(barcode, 10); // Barcode should be integer

        // Basic validation
        if (!itemName || parsedQuantity === undefined || parsedOriginalPrice === undefined || parsedDiscountedPrice === undefined || isNaN(parsedBarcode)) {
            return NextResponse.json({ error: 'Missing or invalid required fields (item name, quantity, prices, or barcode).' }, { status: 400 });
        }
        // Ensure barcode is a whole number
        if (parsedBarcode % 1 !== 0) {
            return NextResponse.json({ error: 'Invalid barcode format. Barcode must be a whole number.' }, { status: 400 });
        }

        if (parsedQuantity < 0) {
            return NextResponse.json({ error: 'Quantity cannot be negative.' }, { status: 400 });
        }
        if (parsedOriginalPrice < 0 || parsedDiscountedPrice < 0) {
            return NextResponse.json({ error: 'Prices cannot be negative.' }, { status: 400 });
        }

        let inventoryDoc = await Inventory.findOne({});

        if (!inventoryDoc) {
            // If no inventory document exists, create a new one with the first product
            inventoryDoc = await Inventory.create({
                inventory: [{
                    itemName,
                    quantity: parsedQuantity, // Use parsed float
                    originalPrice: parsedOriginalPrice, // Use parsed float
                    discountedPrice: parsedDiscountedPrice, // Use parsed float
                    barcode: parsedBarcode,
                }]
            });
            return NextResponse.json({ message: 'Product added successfully', product: inventoryDoc.inventory[0] }, { status: 201 });
        } else {
            const existingItemIndex = inventoryDoc.inventory.findIndex(item => item.barcode === parsedBarcode);

            if (existingItemIndex > -1) {
                // If product with this barcode exists, update its details
                const itemToUpdate = inventoryDoc.inventory[existingItemIndex];
                itemToUpdate.itemName = itemName;
                itemToUpdate.quantity = parsedQuantity; // Overwrite quantity with new (float) value
                itemToUpdate.originalPrice = parsedOriginalPrice;
                itemToUpdate.discountedPrice = parsedDiscountedPrice;

                await inventoryDoc.save();
                return NextResponse.json({ message: 'Product updated successfully', product: itemToUpdate }, { status: 200 });
            } else {
                // If product with this barcode does not exist, add it as a new item
                const newItem = {
                    itemName,
                    quantity: parsedQuantity, // Use parsed float
                    originalPrice: parsedOriginalPrice, // Use parsed float
                    discountedPrice: parsedDiscountedPrice, // Use parsed float
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