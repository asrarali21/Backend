import { asyncHandler } from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadoncloudinary} from "../utils/cloudinary.js"
import {ApiResponse}  from "../utils/apiResponse.js"


const GenerateAccessAndRefreshToken = async (userId)=>{
   try {
      const user = await User.findById(userId)
     const accessToken = user.GeneratedAccessToken()
     const refreshToken = user.GeneratedRefreshToken()

     user.refreshToken = refreshToken
     await user.save({validateBeforeSave : false})

     return {accessToken , refreshToken}
   } catch (error) {
    throw new ApiError(500 , "something went wrong while generating refresh and access token ")
   }
}

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
     
   const existedUser =  await  User.findOne({
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

const loginUser = asyncHandler (async (req , res )=>{
  //req.body = data
  //find user
  //password check
  //access token and refresh token
  //send cookies
    const {username , email , password} = req.body

    if (!username || !email) {
      throw new ApiError(400 , "enter username or email")
    }


   const user = await User.findOne({
      $or : [{username}, {email}]
    })

    if (!user) {
       throw new ApiError(401 , "user doesnt exist")
    }

   const validPassword = await user.isPasswordCorrect(password)

    if (!validPassword) {
      throw new ApiError(404 , "invalid credential")
    }

    const {accessToken , refreshToken}  = await GenerateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user.id).select( "-password ", "-refreshToken")

    //whenever we have to send cookie we have to design options
    const options ={
      httpOnly : true,
      secure : true 
    }

    return res.status(200)
    .cookie("accessToken" ,  accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
      new ApiResponse(200 ,
        {
          user : loggedInUser , accessToken , refreshToken  
        },
        "user logged in successfully"
      )
    )
})

const logoutUser = asyncHandler ( async (req , res) =>{
      
})

export default{
  registerUser , loginUser
} 