import { NextResponse } from 'next/server';
import Inventory from '@/models/inventoryModel';
import connectDb from '@/lib/connectDb';

export async function GET(request) {
    await connectDb();

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name || name.length < 2) {
        return NextResponse.json(
            { error: 'Search term must be at least 2 characters long.' },
            { status: 400 }
        );
    }

    try {
        const inventories = await Inventory.find({
            'inventory.itemName': { $regex: name, $options: 'i' }
        }, {
            'inventory.$': 1
        });

        let products = [];
        if (inventories && inventories.length > 0) {
            inventories.forEach(invDoc => {
                if (invDoc.inventory && invDoc.inventory.length > 0) {
                    const existingProduct = products.find(p => p.barcode === invDoc.inventory[0].barcode);
                    if (!existingProduct) {
                        products.push({
                            itemName: invDoc.inventory[0].itemName,
                            price: invDoc.inventory[0].discountedPrice || invDoc.inventory[0].originalPrice,
                            barcode: invDoc.inventory[0].barcode,
                            originalPrice: invDoc.inventory[0].originalPrice,
                            discountedPrice: invDoc.inventory[0].discountedPrice
                        });
                    }
                }
            });
        }
        
        const topProducts = products.slice(0, 6);

        return NextResponse.json({ products: topProducts }, { status: 200 });

    } catch (error) {
        console.error('Error searching products by name:', error);
        return NextResponse.json(
            { error: 'Failed to search products.', details: error.message },
            { status: 500 }
        );
    }
}