import { Type } from 'lucide-react'
import mongoose, { mongo } from 'mongoose'

const itemSchema = new mongoose.Schema({
    itemName: String,
    quantity: {
        type:Number
    },
    originalPrice:Number,
    discountedPrice:Number,
    barcode: Number
})


const inventorySchema = new mongoose.Schema({
    inventory: [itemSchema]
})

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory',inventorySchema)

export default Inventory