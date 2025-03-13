import { Request, Response } from "express";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import PQueue from "p-queue";
import puppeteer, { Browser, Page } from "puppeteer";

import noticeModel from "../db/models/notice.model";
import catchAsync from "../utils/catchAsync";
import appLogger from "../utils/logger";

const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET!;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;
const AWS_REGION = process.env.AWS_REGION!;
const MAX_CONCURRENT_JOBS = Number(process.env.MAX_CONCURRENT_JOBS!) || 5;

const s3 = new S3Client({
    region: AWS_REGION!,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID!,
        secretAccessKey: AWS_SECRET_ACCESS_KEY!,
    },
});

let browser: Browser | null = null;
const pagePool: Page[] = [];
const queue = new PQueue({ concurrency: MAX_CONCURRENT_JOBS });

const initBrowser = async (): Promise<void> => {
    if (!browser) {
        console.log("Launching Puppeteer...");
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        for (let i = 0; i < MAX_CONCURRENT_JOBS; i++) {
            pagePool.push(await browser.newPage());
        }
    }
};

const closeBrowser = async () => {
    console.log("Closing Puppeteer...");
    if (browser) {
        await browser.close();
        browser = null;
    }
    process.exit(0); // Ensuring that the process exits
};

process.on("exit", closeBrowser);

const getPage = async (): Promise<Page> => {
    try {
        return pagePool.length > 0 ? pagePool.pop()! : await browser!.newPage();
    } catch (error: any) {
        appLogger.error("Failed to get a Puppeteer page", JSON.stringify({ error: error.stack }));
        throw new Error("Failed to get a Puppeteer page");
    }
};

const releasePage = (page: Page) => {
    pagePool.push(page);
};

initBrowser().catch(console.error);

export const generatePDF = catchAsync(async (req: Request, res: Response) => {
    const { noticeId } = req.params;
    const uniqueFileName = `${noticeId}-${Date.now()}.pdf`;
    if (!noticeId) {
        return res.status(400).json({ message: "Notice ID is required" });
    }

    console.log(`Processing PDF for Notice ID: ${noticeId}...`);

    const notice: any = await noticeModel.findById(noticeId).populate("templateId");
    if (!notice || !notice.templateId) {
        return res.status(400).json({ message: `Notice or template not found for ID: ${noticeId}` });
    }

    if (!notice?.templateId?.content) {
        return res.status(400).json({ message: `Template not found for Notice ID: ${noticeId}`});
    }

    const noticeData = {
        ...notice.dynamicData,
        recipient_name: notice.recipient_name,
        recipient_email: notice.recipient_email,
        recipient_address: notice.recipient_address,
        recipient_phone: notice.recipient_phone,
    };

    let htmlContent = (notice.templateId as any).content;
    for (const [key, value] of Object.entries(noticeData)) {
        htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, "g"), value);
    }

    res.status(202).json({
        message: "PDF generation request received. Processing in the background.",
        fileName: uniqueFileName,
    });

    console.log(`Queued PDF generation for Notice ID: ${noticeId}`);
    queue.add(async () => {
        try {
            await processPDFGeneration(noticeId, uniqueFileName, htmlContent, notice);
        } catch (error: any) {
            appLogger.error("Queue job failed", JSON.stringify({ error: error.stack }));
        }
    });
});

const processPDFGeneration = async (noticeId: string, uniqueFileName: string, htmlContent: any, notice: any) => {
    const page = await getPage();
    try {
        // Setting timeout to 10s as  Large HTML may cause Puppeteer to crash.
        await page.setContent(htmlContent, { waitUntil: "domcontentloaded", timeout: 10000 });

        const pdfBuffer = await page.pdf({
            margin: { top: "50px", right: "30px", bottom: "50px", left: "30px" },
            printBackground: true,
            format: "A4",
        });

        releasePage(page);

        const fileKey = `notices/${uniqueFileName}`;
        await s3.send(new PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: fileKey,
            Body: pdfBuffer,
            ContentType: "application/pdf",
        }));

        const s3Url = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileKey}`;

        notice.fileName = uniqueFileName;
        notice.fileUrl = s3Url;
        notice.fileStatus = "completed";
        await notice.save();

        console.log(`PDF successfully generated for Notice ID: ${noticeId}`);
    } catch (error: any) {
        appLogger.error(`PDF Generation Failed: ${error.message}`, JSON.stringify({
            error: error.stack,
            noticeId,
            uniqueFileName,
            step: "PDF Generation",
        }));

        notice.fileStatus = "failed";
        await notice.save();
    } finally {
        releasePage(page);
    }
};

export const downloadPDF = catchAsync(async (req: Request, res: Response) => {
    const fileName = req.params.filename;
    if (!fileName) {
        return res.status(400).json({ message: "Filename is required" });
    }

    const notice = await noticeModel.findOne({ fileName });
    if (!notice) {
        return res.status(404).json({ message: "Invalid file name" });
    }

    if (notice.fileStatus === "failed") {
        return res.status(400).json({ message: "PDF generation failed" });
    }

    if (notice.fileStatus === "pending") {
        return res.status(202).json({ message: "PDF generation is in progress" });
    }

    const params = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: `notices/${fileName}`,
    });

    const signedUrl = await getSignedUrl(s3, params, { expiresIn: 300 }); //5 seconds

    res.status(200).json({
        message: "Pre-signed URL generated successfully",
        signedUrl,
    });
});
