import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    shopName: String,
    ownerName:String,
    email:String,
    phoneNumber:Number,
    city:String,
    category:String,
    password:String
})

const User = mongoose.models.User || mongoose.model('User',userSchema)

export default User