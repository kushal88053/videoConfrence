import { authConfig } from './auth';

const isProduction = process.env.NETTU_IS_PRODUCTION === 'true';

const baseFrontendURL = process.env['FRONTEND_URL']!;
const baseServerURL = process.env['SERVER_URL']!;

const elasticsearchURL = process.env['NETTU_ELASTIC_URL'];

const awsConfig = {
    secretKey: process.env['AWS_SECRET_ACCESS_KEY']!,
    accessKeyId: process.env['AWS_ACCESS_KEY_ID']!,
    sesEmailSource: process.env['SES_EMAIL_SOURCE']!,
    mediaBucket: process.env['S3_BUCKET']!,
    region: 'eu-west-1',
};

const SMTP = {
    smtpHost: 'smtp.gmail.com', // Replace with your SMTP host
    smtpPort: 587, // Replace with your SMTP port
    smtpSecure: false, // Set to true if using port 465
    smtpUser: process.env.EMAIL_USER, // SMTP username
    smtpPassword: process.env.EMAIL_PASS, // SMTP password
    sesEmailSource: 'kp88053@gmail.com', // Sender email

};

const defaultAccountName = 'nettumeet';

export { isProduction, defaultAccountName, authConfig, awsConfig, baseFrontendURL, baseServerURL, elasticsearchURL, SMTP };
