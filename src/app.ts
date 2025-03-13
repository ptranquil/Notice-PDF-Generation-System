import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import appRouter from "./routers/router";
import globalErrorHandler from "./controllers/error-controller";
import { connectToDB } from "./db/db-connection";

connectToDB().then(() => {
  console.log('Database Connected!!!!')
}).catch(error => {
  console.log('Database Connection Failed: ', error)
})

const app = express();
app.use(cors());
app.use(express.json({ limit: '10000kb' }));
app.use(express.urlencoded({ extended: true, limit: '10000kb' }));

const limiter = rateLimit({
  max: 10000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
// app.use(limiter); // Commenting as for request the postman express is not able to detect the IP

// Setting security HTTP headers
app.use(helmet());

app.get("/health_check", (req, res) => {
  const data = {
    status: true,
    message: "Hello World!",
  };

  res.status(200).send({
    data,
  });
});

app.use("/api/v1/", appRouter);

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  res.status(400).send({
    message: `Can't find ${req.originalUrl} on this server!`
  })
});

app.use(globalErrorHandler);

export default app;
