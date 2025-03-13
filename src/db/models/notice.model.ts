import mongoose, { Schema, Document } from "mongoose";

export interface INotice extends Document {
    templateId: mongoose.Types.ObjectId;
    recipient_name: string;
    recipient_email: string;
    recipient_phone?: string;
    recipient_address?: string;
    dynamicData: Record<string, any>;
    fileName?: string;
    fileUrl?: string;
    fileStatus: "pending" | "completed" | "failed";
    createdAt: Date;
    updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
    {
        templateId: {
            type: Schema.Types.ObjectId,
            ref: "Template",
            required: true,
        },
        recipient_name: { type: String, required: true },
        recipient_email: { type: String, required: true },
        recipient_phone: { type: String },
        recipient_address: { type: String },
        dynamicData: { type: Schema.Types.Mixed, required: true },
        fileName: { 
            type: String, 
            required: function () { return this.fileStatus === "completed"; } 
        },
        fileUrl: { 
            type: String, 
            required: function () { return this.fileStatus === "completed"; } 
        },
        fileStatus: { 
            type: String, 
            enum: ["pending", "completed", "failed"], 
            default: "pending" 
        },
    },
    { timestamps: true }
);

const noticeModel = mongoose.model<INotice>("Notice", NoticeSchema);
export default noticeModel;
