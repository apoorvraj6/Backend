import dotenv from 'dotenv';
import connectdb from './db/index.js';
dotenv.config({
    path:'./env'
});



connectdb();





















/*
import express from 'express'
const app = express();

(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}` )
        app.on('error', (err) => {
            console.error(err);
        });

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
})()

*/

