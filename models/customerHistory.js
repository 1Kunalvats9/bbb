import mongoose from 'mongoose';

const productInOrderSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const orderHistorySchema= new mongoose.Schema({
    // customerName: {
    //     type: String,
    //     required: false,
    //     default: 'Guest Customer'
    // },
    customerPhoneNumber: {
        type: String,
        required: false,
    },
    products: {
        type: [productInOrderSchema],
        required: true,
        default: []
    },
    orderTime: { 
        type: Date,
        required: true,
        default: Date.now
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    }
}, { timestamps: true }); 

const OrderHistory = mongoose.models.OrderHistory || mongoose.model('OrderHistory', orderHistorySchema);

export default OrderHistory;