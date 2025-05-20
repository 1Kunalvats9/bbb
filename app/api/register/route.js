import connectDb from '@/lib/connectDb';
import User from '@/models/userModel';
import mongoose from 'mongoose'
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'

export async function POST(req){
    try{
        const { shopName, ownerName, email, password, city, phoneNumber } = await req.json();
        await connectDb();
        const user = await User.findOne({email})
        if(user){
            return NextResponse.json({message:'User already exists'},{status:409})
        }
        const hashedPassword = await bcrypt.hash(password,10)

        const newUser = await User.create({
            shopName, 
            ownerName, 
            email, 
            password:hashedPassword, 
            city, 
            phoneNumber
        })

        return NextResponse.json({ message: 'User registered successfully'}, { status: 201 });
    }catch(err){
        console.log('error in registering the user',err)
        return NextResponse.json({message:"Error in registering the user"},{status:500})
    }
}
