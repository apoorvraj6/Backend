const asyncHandler = (requestHandeler) =>{
    return (req,res,next)=>{
        Promise.resolve(requestHandeler(req,res,next)).catch((error)=>next(error))
    }
}



export {asyncHandler}


// const asyncHandler = (fn) => async(req,res,next) =>{
//     try {
//         return await fn(req,res,next);
        
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message || 'Server Error'
//         })
//     }
// }