import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

async function connecttodb(){
    await mongoose.connect(process.env.MONGO_URI)
    console.log("mongodb connected sucesfully");
    
}

export default connecttodb;