import { NextFunction, Request, Response } from "express";
import templateModel from "../db/models/template.model";
import catchAsync from "../utils/catchAsync";

export const createTemplate = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, content } = req.body;

        // Checking if a template with the same name already exists
        const existingTemplate = await templateModel.findOne({ name });
        if (existingTemplate) {
            return res.status(409).json({ message: "Template with this name already exists" });
        }

        const template = new templateModel({ name, content });
        await template.save();
        res.status(201).json({ message: "Template created", templateId: template._id });
    } catch (error) {
        res.status(500).json({ message: "Error creating template", error });
    }
});