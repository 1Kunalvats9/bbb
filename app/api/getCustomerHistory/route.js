import OrderHistory from '@/models/customerHistory';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';


export async function GET(req) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const { search } = Object.fromEntries(req.nextUrl.searchParams.entries());

        if (!search) {
            return NextResponse.json({ error: "Search query parameter is missing." }, { status: 400 });
        }

        const query = {
            $or: [
                { customerName: { $regex: search, $options: 'i' } }, // Case-insensitive search for name
                { customerPhoneNumber: { $regex: search } } // Exact search for phone number
            ]
        };

        const history = await OrderHistory.find(query).sort({ orderTime: -1 }); // Sort by orderTime descending

        return NextResponse.json(history, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch customer history by search query:", error);
        return NextResponse.json({ error: "Failed to fetch customer history" }, { status: 500 });
    }
}