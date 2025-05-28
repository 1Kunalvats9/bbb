import OrderHistory from '@/models/customerHistory';
import connectDb from '@/lib/connectDb'; 
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await connectDb();
        const history = await OrderHistory.find({}).sort({ orderTime: -1 });

        return NextResponse.json(history, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch all customer history for analytics:", error);
        return NextResponse.json({ error: "Failed to fetch all customer history" }, { status: 500 });
    }
}