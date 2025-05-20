import mongoose from "mongoose";
import Inventory from "@/models/inventoryModel";
import { NextResponse } from "next/server";
export async function GET() {
    try {
        await mongoose.connect(process.env.MONGODB_URI); // Ensure you have MONGODB_URI in your env
        const inventory = await Inventory.findOne({});

        if (!inventory) {
            return NextResponse.json({ error: "Inventory not found" }, { status: 404 });
        }
        return NextResponse.json(inventory.inventory, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch inventory:", error);
        return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
    }
}