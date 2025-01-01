import { Result } from '../../../shared/core/Result';
import { Entity } from '../../../shared/domain/Entity';
import { UniqueEntityID } from '../../../shared/domain/UniqueEntityID';
import { UserEmail } from './userEmail';

interface IEmailTokenProps {
    token: string;
    expiry: Date;
    errorAttempts: number;
    email: UserEmail;
}

export class EmailVerificationToken extends Entity<IEmailTokenProps> {
    private static readonly NUMBER_DIGITS = 6;
    private static readonly TOKEN_EXPIRY_HOURS = 6;
    private static readonly MAX_ERROR_ATTEMPTS = 10;

    get tokenId(): UniqueEntityID {
        return this._id instanceof UniqueEntityID ? this._id : new UniqueEntityID(this._id); // Ensure _id is a UniqueEntityID
    }

    get token(): string {
        return this.props.token;
    }

    get expiry(): Date {
        return this.props.expiry;
    }

    get errorAttempts(): number {
        return this.props.errorAttempts;
    }

    get email(): UserEmail {
        return this.props.email;
    }

    public isCodeExpired(): boolean {
        return new Date() > this.expiry;
    }

    public isCodeValid(code: string): boolean {
        return this.token.toUpperCase() === code.toUpperCase() && !this.isCodeExpired();
    }

    public hasExceededErrorAttempts(): boolean {
        return this.errorAttempts >= EmailVerificationToken.MAX_ERROR_ATTEMPTS;
    }

    public incErrorAttempts(): void {
        this.props.errorAttempts += 1;
    }

    public renewExpiry(): void {
        this.props.expiry = EmailVerificationToken.createExpiry();
    }

    public canBeConsumed(): boolean {
        return !this.hasExceededErrorAttempts() && !this.isCodeExpired();
    }

    private static createExpiry(): Date {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + this.TOKEN_EXPIRY_HOURS);
        return expiry;
    }

    private constructor(props: IEmailTokenProps, id?: UniqueEntityID) {
        super(props, id ? id : new UniqueEntityID()); // Pass UniqueEntityID if id is not provided
    }

    public static create(props: Partial<IEmailTokenProps>, id?: UniqueEntityID): Result<EmailVerificationToken> {
        if (!props.email) {
            return Result.fail('Cannot create email verification token without an email.');
        }

        const email = props.email;
        const errorAttempts = props.errorAttempts ?? 0;
        const token = props.token ?? EmailVerificationToken.generateToken();
        const expiry = props.expiry ?? EmailVerificationToken.createExpiry();

        return Result.ok<EmailVerificationToken>(
            new EmailVerificationToken(
                {
                    token,
                    expiry,
                    errorAttempts,
                    email,
                },
                id ?? new UniqueEntityID(), // Use UniqueEntityID when id is not provided
            ),
        );
    }

    private static generateToken(): string {
        const chars = '0123456789';
        let token = '';
        for (let i = 0; i < this.NUMBER_DIGITS; i++) {
            token += chars[Math.floor(Math.random() * chars.length)];
        }
        return token;
    }
}
