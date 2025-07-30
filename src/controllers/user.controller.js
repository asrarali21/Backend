import { asyncHandler } from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadoncloudinary} from "../utils/cloudinary.js"
import {ApiResponse}  from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

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
    console.log(req.body);
    

  if (!username && !email) {
        throw new ApiError(400, "username or email is required")
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

    const loggedInUser = await User.findById(user.id).select( "-password -refreshToken")

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
     await  User.findByIdAndUpdate(
        req.user._id,
        {
          $set:{
            refreshToken : undefined
          }
        },
        {
          new :true
        }
      ) 
         const options ={
      httpOnly : true,
      secure : true 
    }
    return res.status(200)
    .clearCookie("accessToken", options )
    .clearCookie("refreshToken", options )
    .json(new ApiResponse(200 , {}, "user logged out"))
})
//these is used for new refresh token after the expiration of access token and prevent from user loggin in again 
const newrefreshaccessToken = asyncHandler (async(req , res)=>{
     const incomingrefreshtoken = req.cookie.refreshToken || req.body.refreshToken

     if (!incomingrefreshtoken) {
      throw new ApiError(400 , "unauthorized access")
      
     const decodedToken =  jwt.verify(incomingrefreshtoken , process.env.REFRESH_TOKEN_SECRET)

     const user =  await User.findById(decodedToken?._id)
      
         if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingrefreshtoken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }

        const {accessToken ,  newRefreshToken}  = await GenerateAccessAndRefreshToken(user._id)

       const options ={
      httpOnly : true,
      secure : true 
    }
        return res.status(200)
         .cookie("accessToken" ,accessToken ,options)
         .cookie("refreshToken" , newRefreshToken ,options)
         .json(200 , {accessToken ,  refreshToken : newRefreshToken } , "access token refreshed")
     
     }
})

const changeCurrentPassword = asyncHandler (async()=>{
   const {oldpassword , newpassword} = req.body

    const user = await   User.findById(req?.user.id)

    const isPasswordCorrect = user.isPasswordCorrect(oldpassword)

    if (!isPasswordCorrect) {
      throw new ApiError(401 , "invalid old password")
    }
    user.password = newpassword
   await user.save({validateBeforeSave:false})
    console.log(user);
    
    return res.status(200)
    .json( ApiResponse ( 200 ,{} , "successfully password updated"))
})

const getcurrentUser = asyncHandler (async (req , res) =>{
     res.status(200)
     .json(new ApiResponse(200 , {user:req.user}, "successfully fetched user"))
})

const updatedaccountDetails = asyncHandler (async (req , res)=>{
    const {fullname , email}  =req.body
  
    const user = User.findByIdAndUpdate(req.user._id , 
      {
        $set :{
          fullname,
          email
        }
      }, 
      {
         new:true
      }
    ).select("-password")
    return res.status(200)
    .json(new ApiResponse(200 , {user} , "user details updated successfully"))
})

const updateAvatarImages = asyncHandler (async(req ,res)=>{
     
   const localavatarpath =  req?.files?.path

   if (!localavatarpath ) {
               throw new ApiError(400 , "avatar file path is missing")
   }

   const avatar =await uploadoncloudinary(localavatarpath)

   if (!avatar?.url) {
       throw new ApiError(400 , "error while uploading the  avatar")
   }
  const user  =await User.findByIdAndUpdate(req.user?._id , 
      {
        $set:{
         avatar: avatar.url
        }
      },
      {
        new:true
      }
    ).select("-password")

    res.status(200).json(new ApiResponse(200 , user, "avatar updated successfully"))

})

const updatecoverImages = asyncHandler (async(req ,res)=>{
     
   const localcoverimagepath =  req?.files?.path

   if (!localcoverimagepath ) {
               throw new ApiError(400 , "avatar file path is missing")
   }

   const coverimage =await uploadoncloudinary(localcoverimagepath)

   if (!coverimage?.url) {
       throw new ApiError(400 , "error while uploading the  cover image")
   }
  const user  =await User.findByIdAndUpdate(req.user?._id , 
      {
        $set:{
         coverimage: coverimage.url
        }
      },
      {
        new:true
      }
    ).select("-password")

    res.status(200).json(new ApiResponse(200 , user, "cover image updated successfully"))

})


const getUserchannelProfile = asyncHandler (async (req, res)=>{
        const {username} = req.params

        if (!username) {
           throw new ApiError(401 , "username missing")
        }

     const channel  =   await User.aggregate([
          {
            $match:{
              username:username?.toLowerCase()
            }
          },
          {
               $lookup :{
                from : "subscription",
                localField : "_id",
                foreignField : "channel",
                as : "subscriber"
               }
          },
          {
               $lookup :{
                from : "subscription",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
               }
          },
          {
            $addFields :{
              subscribersCount : {
                  $size:"$subscriber"
              },
                channelssubscribedToCount : {
                  $size:"$subscribedTo"
              },
              isSubscribed : {
                    $cond : {
                      if : {$in : [req.user?._id , "$subscriber.subscribe"]},
                      then : true,
                      else:false
                    }
                   }
               
            }
          },
          {
            $project:{
              fullname:1,
              username: 1,
              subscribersCount:1,
              channelssubscribedToCount:1,
              isSubscribed:1,
              email:1,
              avatar:1,
              coverimage:1
            }
          }
        ])
    console.log(channel);
    
        if (!channel?.length) {
          throw new ApiError(400 , "channel does not exist")
        }

        res.status(200)
        .json(ApiResponse(200 ,channel[0], "user channel fetched succssfully"))
})


const userWatchHistory = asyncHandler (async()=>{
      const user = await user.aggregate([{
           $match:{
             _id : new mongoose.Types.ObjectId(req.user._id)
           }
      }])
})






export default {
 registerUser , loginUser , logoutUser ,newrefreshaccessToken ,changeCurrentPassword
 ,getcurrentUser , updatedaccountDetails , updateAvatarImages , updatecoverImages
} 
 