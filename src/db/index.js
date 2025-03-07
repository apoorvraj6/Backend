import mongoose from 'mongoose'
import {DB_NAME} from '../constant.js'


const connectdb = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}` )
        console.log(`\n MongoDB connected to ${connectionInstance} \n`)
    } catch (error) {
        console.error('Mongodb connection failded',error);
        process.exit(1);
    }
}


export default connectdb;
