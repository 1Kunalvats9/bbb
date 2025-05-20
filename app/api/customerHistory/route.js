import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import OrderHistory from '@/models/customerHistory';

export async function GET() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const history = await OrderHistory.find({}).sort({ orderTime: -1 });

        return NextResponse.json(history, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch all customer history:", error);
        return NextResponse.json({ error: "Failed to fetch all customer history" }, { status: 500 });
    }
}