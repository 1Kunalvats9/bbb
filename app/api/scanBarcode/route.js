import { NextResponse } from 'next/server';
import Inventory from "@/models/inventoryModel";
import connectDb from '@/lib/connectDb';

export async function POST(req) {
  try {
    await connectDb();
    const { barcode } = await req.json();

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
    }

    const numericBarcode = parseInt(barcode, 10);
    if (isNaN(numericBarcode)) {
      return NextResponse.json({ error: 'Invalid barcode format. Barcode must be a number.' }, { status: 400 });
    }

    const globalInventoryDoc = await Inventory.findOne({
      'inventory.barcode': numericBarcode
    }, { 
      'inventory.$': 1, 
      _id: 0 
    });

    if (!globalInventoryDoc) {
      console.log('Product with this barcode does not exist')
      return NextResponse.json({ message: 'Product with this barcode does not exist' }, { status: 404 });
    }

    if (globalInventoryDoc.inventory.length === 0) {
        return NextResponse.json({ message: 'Product with this barcode does not exist' }, { status: 404 });
    }

    const foundProduct = globalInventoryDoc.inventory[0];
    return NextResponse.json({
      message: 'Product with this barcode exists',
      product: {
        itemName: foundProduct.itemName,
        barcode: foundProduct.barcode,
        quantity: foundProduct.quantity,
        originalPrice: foundProduct.originalPrice,
        discountedPrice: foundProduct.discountedPrice,
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error checking for barcode:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
