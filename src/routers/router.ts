import { Router } from "express";
import { createNotice } from "../controllers/noticeController";
import { createTemplate } from "../controllers/templateController";
import { downloadPDF, generatePDF } from "../controllers/pdfController";

const appRouter = Router();

appRouter.post("/templates", createTemplate);
appRouter.post("/notices", createNotice);
appRouter.use("/pdfs/generate-pdf/:noticeId", generatePDF);
appRouter.use("/download/:filename", downloadPDF);

export default appRouter;
