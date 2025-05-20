// pages/api/checkout.js (or app/api/checkout/route.js for App Router)

import { NextResponse } from 'next/server';
import connectDb from '@/lib/connectDb'; 
import Inventory from '@/models/inventoryModel'; 
import OrderHistory from '@/models/customerHistory'; 

export async function POST(req) {
    try {
        await connectDb(); 

        const { customer, items, totalAmount, orderDate } = await req.json();
        if (!customer || !customer.phone || !items || items.length === 0 || totalAmount === undefined) {
            return NextResponse.json({ message: 'Missing required order data.' }, { status: 400 });
        }
        const globalInventoryDoc = await Inventory.findOne({}); 

        if (!globalInventoryDoc) {
            return NextResponse.json({ message: 'Global inventory document not found.' }, { status: 500 });
        }

        for (const orderItem of items) { 
            const { productName, quantity: orderedQuantity } = orderItem;
            const inventoryItem = globalInventoryDoc.inventory.find(
                (invItem) => invItem.itemName === productName
            );

            if (!inventoryItem) {
                return NextResponse.json({ message: `Product "${productName}" not found in inventory.` }, { status: 404 });
            }
            if (inventoryItem.quantity < orderedQuantity) {
                return NextResponse.json({ message: `Insufficient stock for "${productName}". Available: ${inventoryItem.quantity}, Requested: ${orderedQuantity}` }, { status: 400 });
            }
            inventoryItem.quantity -= orderedQuantity;
        }
        await globalInventoryDoc.save();

        const productsForHistory = items.map(item => ({
            itemName: item.productName,
            quantity: item.quantity,
            price: item.unitPrice,
        }));

        const newOrderEntry = {
            customerName: customer.name || 'Guest Customer',
            customerPhoneNumber: customer.phone,
            products: productsForHistory,
            orderTime: new Date(orderDate),
            totalAmount: totalAmount,
        };

        const createdOrder = await OrderHistory.create(newOrderEntry);

        return NextResponse.json(
            {
                message: 'Checkout successful!',
                orderId: createdOrder._id,
            },
            { status: 200 }
        );

    } catch (err) {
        console.error('Error in checkout API:', err);
        return NextResponse.json({ message: 'Internal server error during checkout.' }, { status: 500 });
    }
}