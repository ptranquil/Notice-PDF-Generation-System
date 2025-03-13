import app from "./app";

process.on("uncaughtException", (err: any) => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(err);
    process.exit(1);
});
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", (err: any) => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...");
    console.error(err);
    server.close(() => {
        process.exit(1);
    });
});