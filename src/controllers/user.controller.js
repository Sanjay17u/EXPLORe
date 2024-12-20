import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOncloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndrefreshTokens = async(userId) => {
  try {
    const user = await User.findById(userId)
    const accesstoken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return {accesstoken, refreshToken}

  } catch (error) {
    throw new ApiError(500, 'Something Went Wrong While Generating Access and refresh Token')
  }
}


const registerUser = asyncHandler( async (req, res) => {
   const {fullName, username, email, password} = req.body
   
   if(
    [fullName, email, username, password].some((fields)=> fields?.trim() === "")
   ) {
    throw new ApiError(400, "All Fields are Required.")
   }

   const existedUser = await User.findOne({
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

   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   ) 

   if(!createdUser) {
    throw new ApiError(500, "Something went Wrong While Registering the User.")
   }

   return res.status(201).json(
    new ApiResponse(200,createdUser, "User Registered Successfully")
   )
} )

const loginUser = asyncHandler(async (req, res) => {
  const {username, email, password} = req.body
  if(!(username || email)) {
    throw new ApiError(400, "Username and Email is Required") 
  }

  const user = await User.findOne({
    $or: [{username}, {email}]
  })

  if(!user) {
    console.log("No user found with username or email:", { username, email });
    throw new ApiError(404, 'User Doest Exists')
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password)

  if(!isPasswordCorrect) {
    throw new ApiError(401, 'Invalid User Credentials')
  }

  const { accesstoken, refreshToken } = await generateAccessAndrefreshTokens(user._id)

  const loggedInUser = await User.findById(user.id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
  .cookie("accessToken", accesstoken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser, accesstoken, refreshToken
      },
      "User Logged In Successfully"
    )
  )

})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User Logged Out"))
})

export {
    registerUser,
    loginUser,
    logoutUser
}