import mongoose from 'mongoose'


const cartItemSchema = new mongoose.Schema({
    itemName: String,
    itemQuantity: String,
    barcode:Number
})

export const cartSchema = new mongoose.Schema({
    cart:[cartItemSchema]
})

const Cart = mongoose.models.Cart || mongoose.model('Cart',cartSchema);

export default Cart;
