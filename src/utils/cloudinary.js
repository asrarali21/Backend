import { v2 } from "cloudinary";
import fs from "fs"

cloudinary.config({ 
        cloud_name: process.env.COULDINARY_CLOUD_NAME,
        api_key: process.env.COULDINARY_API_KEY,
        api_secret: COULDINARY_API_SECRET
    });


const uploadoncloudinary = async (localFilePath)=>{
   try {
       if (!localFilePath) return null
      const response =  await  cloudinary.uploader.upload(localFilePath, {
         resource_type : "auto"
       }) 
       console.log("uploaded successfully", response.url);
       return response
   } catch (error) {
         fs.unlinkSync(localFilePath)
         return null
   } 
}    

export {uploadoncloudinary}