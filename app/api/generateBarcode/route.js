import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const newBarcode = Math.floor(Math.random() * 1000000000000);
    return NextResponse.json({ barcode: newBarcode.toString()},{status:200})
  } catch (error) {
    console.error('Error generating barcode:', error);
    return NextResponse.json({ error: 'Failed to generate barcode: ' + error.message },{status:500});
  }
}