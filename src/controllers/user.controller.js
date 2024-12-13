import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOncloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

 const registerUser = asyncHandler( async (req, res) => {
   const {fullName, username, email, password} = req.body
   
   if(
    [fullName, email, username, password].some((fields)=> fields?.trim() === "")
   ) {
    throw new ApiError(400, "All Fields are Required.")
   }

   const existedUser = User.findOne({
    $or: [{ username }, { email }]
   })

   if(existedUser) {
    throw new ApiError(409, "User with this email and username is already exist's.")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path
   const coverImageLocalPath = req.files?.coverImage[0]?.path

   if(!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is Required.")
   }

   if(!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image File is Required.")
   }

   const avatar = await uploadOncloudinary(avatarLocalPath)
   const coverImage = await uploadOncloudinary(coverImageLocalPath)

   if(!avatar) {
    throw new ApiError(400, "Cover Image File is Required.")
   }

   const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
   })

   const createdUser = User.findById(user._id).select(
    "-password -refreshToken"
   ) 

   if(!createdUser) {
    throw new ApiError(500, "Something went Wrong While Registering the User.")
   }

   return res.status(201).json(
    new ApiResponse(200,createdUser, "User Registered Successfully")
   )
} )

export {
    registerUser
}