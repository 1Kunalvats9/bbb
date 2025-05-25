import { NextResponse } from 'next/server';
import connectDb from '@/lib/connectDb';
import Inventory from '@/models/inventoryModel';

export async function PUT(req) {
    await connectDb();
    try {
        const { itemId, itemName, price, quantity } = await req.json();

        const inventoryDoc = await Inventory.findOne({});

        if (!inventoryDoc) {
            return NextResponse.json({ message: 'Inventory document not found' }, { status: 404 });
        }

        const itemIndex = inventoryDoc.inventory.findIndex(item => item._id.toString() === itemId);

        if (itemIndex === -1) {
            return NextResponse.json({ message: 'Item not found in inventory' }, { status: 404 });
        }

        inventoryDoc.inventory[itemIndex].itemName = itemName;
        inventoryDoc.inventory[itemIndex].discountedPrice = price;
        inventoryDoc.inventory[itemIndex].quantity = quantity;

        await inventoryDoc.save();

        return NextResponse.json({ message: 'Item updated successfully', updatedItem: inventoryDoc.inventory[itemIndex] }, { status: 200 });

    } catch (error) {
        console.error('Error updating inventory item:', error);
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
