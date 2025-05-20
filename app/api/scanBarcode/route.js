import { NextResponse } from 'next/server'; // Import NextResponse
import Inventory from "@/models/inventoryModel";
import connectDb from '@/lib/connectDb'; // Ensure this path is correct

export async function POST(req) { // Renamed to POST, no default export
  const { barcode } = await req.json(); // Get body directly from req.json() in App Router

  if (!barcode) {
    return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
  }

  try {
    await connectDb(); // Connect to the database

    const numericBarcode = parseInt(barcode, 10);
    if (isNaN(numericBarcode)) {
        return NextResponse.json({ error: 'Invalid barcode format. Barcode must be a number.' }, { status: 400 });
    }

    // Query the global Inventory document and find a product within its 'inventory' array
    const globalInventoryDoc = await Inventory.findOne(
        { 'inventory.barcode': numericBarcode }, // Use dot notation to query nested array
        { 'inventory.$': 1, _id: 0 } // Project only the matched item and exclude global _id
    );

    if (globalInventoryDoc && globalInventoryDoc.inventory.length > 0) {
      const foundProduct = globalInventoryDoc.inventory[0]; // The matched product
      
      // Return all necessary product details
      return NextResponse.json({
        message: 'Product with this barcode exists',
        product: {
            itemName: foundProduct.itemName,
            barcode: foundProduct.barcode,
            quantity: foundProduct.quantity,
            originalPrice: foundProduct.originalPrice,
            discountedPrice: foundProduct.discountedPrice,
            // Include any other fields your frontend expects (e.g., description, category)
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Product with this barcode does not exist' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error checking for barcode:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}