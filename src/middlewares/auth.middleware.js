import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT  = asyncHandler(async (req , res , next)=>{
   try {
     const token = req.cookies?.accessToken || req.header ("authorization")?.replace("bearer " , "")
 
     if (!token) {
         throw new ApiError(401 , "unauthorized request")
     }
 
     const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
   const user=  await User.findById(decodeToken?._id).select("-password  -refreshToken")
 
   if (!user) {
     throw new ApiError(401 , "invalid access token")
   }
 
   req.user = user
   next()
   } catch (error) {
    throw new ApiError(401 , "invalid access Token")
   }

})