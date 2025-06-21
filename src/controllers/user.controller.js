import { asyncHandler } from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadoncloudinary} from "../utils/cloudinary.js"
import {ApiResponse}  from "../utils/apiResponse.js"

const registerUser = asyncHandler (async (req , res) => {
  // recieve user data from frontend
  // validation like username is required or etc
  //check if user already exist 
  //check for images , avatar image middleware
  // check uploaded on cloudinary 
  //create user object  - create entry in db
  // remove password and refresh token 
  // return responce
    const {username , email , fullname , password }  = req.body
    console.log(req.body);
    
    if ([username , email , fullname , password ].some((itemFields)=>itemFields?.trim() === "")) {
      throw new ApiError(400 , "All field are required")
    }
     
   const existedUser =  User.findOne({
      $or:[{username }, {email}]
    })

    if (existedUser) {
      throw new ApiError(400 , "user already exist")
    }
    
   const avatarlocalPath = req.files?.avatar[0]?.path
   const coverImagelocalPath = req.files?.avatar[0]?.path
    console.log(req.files);
    
    if (!avatarlocalPath) {
      throw new ApiError(408, "avatar is required")
    }
    
   const avatar = await uploadoncloudinary(avatarlocalPath)
   const coverimage = await uploadoncloudinary(coverImagelocalPath)

   if (!avatar) {
      throw new ApiError(408, "avatar is required")
   }
    
  const user = await User.create({
      fullname,
      avatar : avatar.url,
      coverimage : coverimage?.url || "",
      email,
      password,
      username : username.toLowerCase()
   })

   const createduser = await User.findById(user._id).select(
     "-password -refreshToken"
   )

   if (!createduser) {
      throw new ApiError(500 , "something went wrong registering user")
   }


   return res.status(201).json(
      new ApiResponse(200 , createduser , "user registered successfully")
   )
})



export default registerUser