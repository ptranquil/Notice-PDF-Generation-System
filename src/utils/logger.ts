import { createLogger, format } from 'winston';
const { combine, timestamp, printf } = format;
import DailyRotateFile from 'winston-daily-rotate-file';
import appRoot from 'app-root-path';

const transport: DailyRotateFile = new DailyRotateFile({
  filename: `${appRoot}/logs/log-%DATE%.log`,
  datePattern: 'YYYY-MM',
  maxSize: '20m'
});

const myFormat = printf((info) => {
  let message = `${info.timestamp} | ${info.message} `
  console.log(message)
  message = info.obj ? message + ` | Data:${JSON.stringify(info.obj)} ` : message
  return message;
});

const appLogger = createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    myFormat
  ),
  transports: [
    transport
  ],
  exitOnError: false
});

export default appLogger;
