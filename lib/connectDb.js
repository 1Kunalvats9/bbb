import mongoose from "mongoose"

export default async function connectDb(){
    try{
        const connection = mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        console.log('Mongodb connected succesfully')
    }catch(err){
        console.log('error in connecting to db',err)
        process.exit(1);
    }
}