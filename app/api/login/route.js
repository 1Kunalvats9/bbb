import connectDb from '@/lib/connectDb'
import User from '@/models/userModel'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(req){
    try{
        await connectDb()
        console.log('entered')
        const {email,password} = await req.json()
        const user = await User.findOne({email})
        if(!user){
            return NextResponse.json({message:'User not found!'},{status:404})
        }

        const isMatched = await bcrypt.compare(password,user.password)
        if(!isMatched){
            return NextResponse.json({message:"Email or password is incorrect"},{status:404})
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
          expiresIn: '7d',
        });
        return NextResponse.json({ message: 'Login successful', token },{status:201});
    }catch(err){
        console.log('error in logging in..',err)
        return NextResponse.json({message:'Error in logging in'},{status:500})
    }
}