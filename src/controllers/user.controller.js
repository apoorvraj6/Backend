import {asyncHandler} from '../utils/asyncHandeler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'  
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'


const generateAccessAndRefreshTokens = async(userId)=>{
try {
    const user = await User.findById(userId);
    
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    
    
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave:false});

    return {accessToken,refreshToken};

} catch (error) {
    throw new ApiError(500,"Something went wrong while generating tokens")
}
}


const registerUser = asyncHandler(async(req ,res)=>{
     
    const {fullname,email,username,password} = req.body;

    if([fullname,email,username,password].some((field)=>field?.trim() ===""))
    {
        throw new ApiError(400,"All fields are required");
    }

   const existedUser =  await User.findOne({
        $or:[
            {email},
            {username},
        ]
    })

    if(existedUser){
        throw new ApiError(409,"User already exists");
    }
    
   const avatarLocalPath =  req.files?.avatar[0]?.path;
   
   const coverImageLocalPath = req.files?.cover[0]?.path;

   if(!avatarLocalPath)
    throw new ApiError(400,"Avatar is required");

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if(!avatar){
    throw new ApiError(400,"Avatar upload failed");
   }

   const user = await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage.url || "",
    email,
    password,
    username:username.toLowerCase(),
   })

   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering a user")
   }

   return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
)
})

const loginUser = asyncHandler(async(req,res)=>{
    // fetch the value of username and password
    // validate for empty values
    // check if the user name exists
    // check if the password is correct
    // if correct the generate the access token and refresh token 
    // save the refresh token in the database
    // return the access and refresh token the user with the response


    const {email,username,password} = req.body;

    if(!(username || email) ){
        throw new ApiError(400,"Username is required");
    } 

    if(!password){
        throw new ApiError(400,"Password is required");
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user)
    {
        throw new ApiError(404,"User Does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid Password");
    }
    
    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);
    
    
    const loggedInUser= await User.findById(user._id).select("-password -refreshToken");


    const options = {
        httpOnly:true,
        secure:true,
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},"User loggedIn successfully")
    )

    


})

const logOutUser = asyncHandler(async(req,res)=>{

    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken:undefined,
            }
        },
        {
            new:true,
        }
    )

    const options = {
        httpOnly:true,
        secure:true,
    }

    return res.status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(new ApiResponse(200,{},"User logged out successfully"))
    




})


const refreshAccessToken = asyncHandler(async(req,res)=>{

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user)
        {
            throw new ApiError(401,"Invalid Refresh Token");
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401,"Invalid Refresh Token");
        }
    
        const options = {
            httpOnly:true,
            secure:true,
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"Token refreshed successfully"))

    } catch (error) {
        throw new ApiError(401,"Invalid Refresh Token");
    }
})


export {registerUser,loginUser,logOutUser,refreshAccessToken}