import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const environment = process.env.NODE_ENV || 'development';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${service || 'app'}] ${level}: ${message} ${metaStr}`;
  })
);

// Create logger instance
export const createLogger = (serviceName: string) => {
  return winston.createLogger({
    level: logLevel,
    format: logFormat,
    defaultMeta: { service: serviceName, environment },
    transports: [
      // Console output
      new winston.transports.Console({
        format: environment === 'production' ? logFormat : consoleFormat,
      }),
      // Error log file
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      // Combined log file
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
  });
};

// Default logger
export const logger = createLogger('vpn-enterprise');
