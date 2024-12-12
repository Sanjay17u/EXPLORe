// async wala code --->>>>>

// const asyncHandler = (fn) => {
//    async (req, res, next) => {
//         try {
//             await fn(req, res, next)     
//         } catch (error) {
//             res.status(error.code || 500).json({
//                 success: true,
//                 message: error.message
//             })
//         }
//     }
// }

// export default asyncHandler


// Promises wala code ----->>>>>>

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => {
            next(error)
        })
    }
}

export { asyncHandler }