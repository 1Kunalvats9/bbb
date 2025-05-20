import { NextResponse } from 'next/server';
import Inventory from '@/models/inventoryModel';
import connectDb from '@/lib/connectDb';

export async function PUT(req, { params }) { 
    try {
        await connectDb();

        const { itemName, quantity, originalPrice, discountedPrice, barcode } = await req.json();

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

        const inventoryDoc = await Inventory.findOne({});

        if (!inventoryDoc) {
            return NextResponse.json({ error: 'Inventory document not found.' }, { status: 404 });
        }

        const existingItemIndex = inventoryDoc.inventory.findIndex(item => item.barcode === parsedBarcode);


        if (existingItemIndex > -1) {
            // Product exists, update quantity
            const itemToUpdate = inventoryDoc.inventory[existingItemIndex];
             itemToUpdate.quantity += quantity; // Add the new quantity
            itemToUpdate.itemName = itemName; // Keep itemName
            itemToUpdate.originalPrice = originalPrice;
            itemToUpdate.discountedPrice = discountedPrice;
           if(itemToUpdate.quantity < 0){
             return NextResponse.json({ error: 'Quantity cannot be negative.' }, { status: 400 });
           }

            await inventoryDoc.save();
            return NextResponse.json({ message: 'Quantity updated successfully', product: itemToUpdate }, { status: 200 });
        } else {
            // Product doesn't exist, add new product
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
    } catch (error) {
        console.error('Error in PUT /api/products:', error);
        return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}

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
