import nodemailer from 'nodemailer';
import { SMTP } from '../../../config';
import { getEmailConfirmationTemplate, IEmailVerificationCodeParams } from './htmlTemplates/getTemplate';
// const fetch = require('node-fetch');
import axios from 'axios';

export interface IEmailService {
    sendEmailVerificationCode(toEmail: string, params: IEmailVerificationCodeParams): Promise<void>;
    isDisposable(email: string): Promise<boolean>;
}

export class EmailService implements IEmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: SMTP.smtpHost, // Example: "smtp.mailgun.org"
            port: SMTP.smtpPort, // Example: 587
            secure: SMTP.smtpSecure, // true for 465, false for other ports
            auth: {
                user: SMTP.smtpUser, // SMTP username
                pass: SMTP.smtpPassword, // SMTP password
            },
        });
    }

    async sendEmailVerificationCode(toEmail: string, params: IEmailVerificationCodeParams) {
        const mailOptions = {
            from: SMTP.sesEmailSource, // Sender email address
            to: toEmail, // Recipient email address
            subject: 'Email verification code for Video Meet',
            text: `Email verification code for Video Meet is: ${params.code}`, // Plain text body
            html: getEmailConfirmationTemplate(params), // HTML body
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Verification email sent to ${toEmail}`);
        } catch (error) {
            console.error(`Failed to send email to ${toEmail}:`, error);
            throw new Error(`Failed to send email: ${(error as Error).message}`);
        }
    }

    async isDisposable(email: string): Promise<boolean> {
        try {
            const domain = email.split('@').pop(); // Extract the domain part
            if (!domain) {
                throw new Error('Invalid email format.');
            }

            // Use axios to send the request
            const response = await axios.get(`https://open.kickbox.com/v1/disposable/${domain}`);

            // Axios automatically throws an error for non-2xx responses, so we don't need to manually check for status
            const { disposable } = response.data; // Directly access the response data

            return disposable;
        } catch (error) {
            console.warn(`Error checking disposable email status for ${email}:`, error);
            return false; // Default to false in case of errors
        }
    }

}