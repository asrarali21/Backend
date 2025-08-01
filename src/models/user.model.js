import mongoose ,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userschema = new Schema({
       username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim :true,
        index : true 
       },
           email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim :true,
       },
        fullname : {
        type : String,
        required : true,
        trim :true,
        index : true
       },
        avatar : {
        type : String, // cloudinary url
        required : true 
       }
       ,
        coverimage : {
        type : String,
       },
       watchHistroy :
           [
               {
                   type : Schema.Types.ObjectId,
                   ref : "video"
                }
            ],
       password : {
        type : String,
        required : [true , "password is required"] 
          },
        refreshToken :{
           type : String
        }
        
},{timestamps:true})


userschema.pre("save" , async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password , 10)
    } else{
        next()
    }
})

userschema.methods.isPasswordCorrect = async function (password) {
    return   await bcrypt.compare(password , this.password)
}

userschema.methods.GeneratedAccessToken = function () {
    return  jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username,
        fullname : this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

userschema.methods.GeneratedRefreshToken = function () {
    return  jwt.sign({
        _id : this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}




export const User = mongoose.model("User" , userschema)