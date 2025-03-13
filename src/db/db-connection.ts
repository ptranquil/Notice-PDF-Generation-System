import mongoose from "mongoose";
import appError from "../utils/appError";

export async function connectToDB(): Promise<void> {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
    } catch (error: any) {
        console.log(error)
        throw new appError("Database Connection Failed: ", error.message)
    }
}
