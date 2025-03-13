import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import noticeModel, { INotice } from "../db/models/notice.model";
import catchAsync from "../utils/catchAsync";
import templateModel from "../db/models/template.model";

export const createNotice = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: INotice = req.body;

    // Checking if the templateId is a valid ObjectId
    if (!Types.ObjectId.isValid(data.templateId)) {
      return res.status(400).json({ message: "Invalid templateId" });
    }

    // Checking if the templateId exists in the templateModel
    const template = await templateModel.findById(data.templateId);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    const notice = new noticeModel(data);
    await notice.save();

    res.status(201).json({ message: "Notice created", noticeId: notice._id });
  } catch (error) {
    console.error("Error creating notice:", error);
    res.status(500).json({ message: "Error creating notice", error });
  }
});
