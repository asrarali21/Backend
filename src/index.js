// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";


// ;(async()=>{
//     try {
//          mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//     } catch (error) {
//         console.log( "error",error);
//         throw error
//     }
// })()

import connectDB from "./db/index.js";
import dotenv from "dotenv"

dotenv.config({
    path:"./.env"
})

connectDB().then(()=>{
   app.listen(process.env.PORT || 8000 ,()=>{
     console.log("server started on port", process.env.PORT || 8000);
   })
}).catch((error)=>{
   console.log("MongoDB connection failed",error);
})