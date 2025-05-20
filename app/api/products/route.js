import { NextResponse } from 'next/server';
import Inventory from '@/models/inventoryModel';
import connectDb from '@/lib/connectDb';

export async function POST(req) {
  try {
    await connectDb();
    const { itemName, quantity, originalPrice, discountedPrice, barcode } = await req.json();

    if (!itemName || quantity === undefined || originalPrice === undefined || discountedPrice === undefined || !barcode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    let inventoryDoc = await Inventory.findOne({});
    if (!inventoryDoc) {
      inventoryDoc = await Inventory.create({ inventory: [] });
    }
    inventoryDoc.inventory.push({
      itemName,
      quantity,
      originalPrice,
      discountedPrice,
      barcode: parseInt(barcode, 10),
    });

    await inventoryDoc.save();

    return NextResponse.json({ message: 'Product created successfully', product: { itemName, quantity, originalPrice, discountedPrice, barcode } }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

