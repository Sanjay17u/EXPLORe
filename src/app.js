import express from 'express'
const app = express()
import cookieParser from 'cookie-parser'
import cors from 'cors'

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "17kb"}))
app.use(express.urlencoded({extended: true, limit: '17kb'}))
app.use(express.static("public"))
app.use(cookieParser())

// Import Routes
import userRouter from './routes/user.routes.js'

// routes declaration
app.use('/api/v1/users', userRouter)

export {app}