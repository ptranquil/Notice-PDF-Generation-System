import mongoose, { Schema, Document } from "mongoose";

interface ITemplate extends Document {
    name: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

const templateSchema = new Schema<ITemplate>(
    {
        name: { type: String, required: true, unique: true },
        content: { type: String, required: true },
    },
    { timestamps: true }
);

const templateModel = mongoose.model<ITemplate>("Template", templateSchema);
export default templateModel;
