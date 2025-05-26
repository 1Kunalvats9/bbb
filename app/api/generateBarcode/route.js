import { NextResponse } from "next/server";

function calculateEAN13CheckDigit(first12Digits) {
    if (typeof first12Digits !== 'string' || !/^\d{12}$/.test(first12Digits)) {
        throw new Error("Input must be a 12-digit numeric string for EAN-13 checksum calculation.");
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(first12Digits.charAt(i), 10);
        if (i % 2 === 0) {
            sum += digit * 1;
        } else { 
            sum += digit * 3;
        }
    }

    const remainder = sum % 10;
    const checkDigit = (remainder === 0) ? 0 : (10 - remainder);
    return checkDigit;
}

export async function POST(req) {
  try {
    let random12Digits = '';
    for (let i = 0; i < 12; i++) {
        random12Digits += Math.floor(Math.random() * 10).toString();
    }
    const checkDigit = calculateEAN13CheckDigit(random12Digits);
    const newBarcode = random12Digits + checkDigit.toString();

    return NextResponse.json({ barcode: newBarcode },{status:200})
  } catch (error) {
    console.error('Error generating EAN-13 barcode:', error);
    return NextResponse.json({ error: 'Failed to generate EAN-13 barcode: ' + error.message },{status:500});
  }
}