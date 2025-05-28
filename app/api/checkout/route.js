// pages/api/checkout.js (or app/api/checkout/route.js for App Router)

import { NextResponse } from 'next/server';
import connectDb from '@/lib/connectDb';
import Inventory from '@/models/inventoryModel';
import OrderHistory from '@/models/customerHistory';

export async function POST(req) {
    try {
        await connectDb();

        const { customer, items, totalAmount, orderDate } = await req.json();

        // 1. Input Validation: Ensure all necessary data is present and valid
        if (!customer || !customer.phone || !items || !Array.isArray(items) || items.length === 0 || totalAmount === undefined) {
            return NextResponse.json({ message: 'Missing required order data or invalid items format.' }, { status: 400 });
        }

        // Validate each item in the cart
        for (const item of items) {
            if (!item.productName || item.quantity === undefined || isNaN(parseFloat(item.quantity)) || parseFloat(item.quantity) <= 0 || item.unitPrice === undefined || isNaN(parseFloat(item.unitPrice))) {
                return NextResponse.json({ message: `Invalid item data in cart: ${JSON.stringify(item)}` }, { status: 400 });
            }
            // Ensure quantity is treated as a float
            item.quantity = parseFloat(item.quantity);
            item.unitPrice = parseFloat(item.unitPrice);
        }

        // Validate totalAmount as a float
        const parsedTotalAmount = parseFloat(totalAmount);
        if (isNaN(parsedTotalAmount) || parsedTotalAmount < 0) {
            return NextResponse.json({ message: 'Invalid total amount.' }, { status: 400 });
        }

        const globalInventoryDoc = await Inventory.findOne({});

        if (!globalInventoryDoc) {
            return NextResponse.json({ message: 'Global inventory document not found. Please initialize inventory.' }, { status: 500 });
        }

        // Use a map for faster lookup of inventory items by itemName
        const inventoryMap = new Map(globalInventoryDoc.inventory.map(item => [item.itemName, item]));

        const updates = []; // To store updates for inventory in a single pass

        for (const orderItem of items) {
            const { productName, quantity: orderedQuantity } = orderItem;

            const inventoryItem = inventoryMap.get(productName);

            if (!inventoryItem) {
                return NextResponse.json({ message: `Product "${productName}" not found in inventory.` }, { status: 404 });
            }

            // Important: Convert stored quantity to a float for comparison and arithmetic
            // Assuming inventory quantities might be stored as numbers (integers or strings) in DB
            const currentInventoryQuantity = parseFloat(inventoryItem.quantity);

            if (isNaN(currentInventoryQuantity)) {
                return NextResponse.json({ message: `Inventory quantity for "${productName}" is invalid.` }, { status: 500 });
            }

            // Check for sufficient stock, allowing for float comparisons
            // Using a small epsilon for floating point comparison to avoid issues with tiny differences
            // Or, for stock, you might want strict less than
            if (currentInventoryQuantity < orderedQuantity) {
                return NextResponse.json({ message: `Insufficient stock for "${productName}". Available: ${currentInventoryQuantity.toFixed(2)}, Requested: ${orderedQuantity.toFixed(2)}` }, { status: 400 });
            }

            // Update the quantity. Ensure the result is stored as a float.
            inventoryItem.quantity = currentInventoryQuantity - orderedQuantity;
            updates.push(inventoryItem); // Add to updates array if you decide to update individually
        }

        // Save the updated inventory document
        // This will update all modified items within the 'inventory' array in one go
        await globalInventoryDoc.save();

        // Prepare products for history, ensuring quantities and prices are floats
        const productsForHistory = items.map(item => ({
            itemName: item.productName,
            quantity: item.quantity, // Already parsed as float above
            price: item.unitPrice,   // Already parsed as float above
        }));

        const newOrderEntry = {
            customerPhoneNumber: customer.phone,
            products: productsForHistory,
            orderTime: new Date(orderDate), // Ensure orderDate is a valid date string
            totalAmount: parsedTotalAmount, // Use the parsed float totalAmount
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
        // Provide more specific error messages for debugging if possible
        if (err.name === 'ValidationError') {
            return NextResponse.json({ message: `Validation error: ${err.message}` }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal server error during checkout. Please try again.' }, { status: 500 });
    }
}