import { UniqueEntityID } from '../../../shared/domain/UniqueEntityID';
import { EmailVerificationToken } from '../domain/emailTokenVerification';
import { UserEmail } from '../domain/userEmail';
import { Types } from 'mongoose'; // Import Types from mongoose

export interface EmailVerificationTokenPersistenceRaw {
    _id: Types.ObjectId;
    token: string;
    expiry: number;
    errorAttempts: number;
    email: string;
}

export class EmailVerificationTokenMap {
    /**
     * Converts a persistence object into the domain model.
     */
    public static toDomain(raw: EmailVerificationTokenPersistenceRaw): EmailVerificationToken {
        return EmailVerificationToken.create(
            {
                token: raw.token,
                expiry: new Date(raw.expiry),
                errorAttempts: raw.errorAttempts,
                email: UserEmail.create(raw.email).getValue(),
            },
            new UniqueEntityID(raw._id.toHexString()), // Convert ObjectId to string for domain ID
        ).getValue();
    }

    /**
     * Converts the domain model into a persistence object.
     */
    public static toPersistence(token: EmailVerificationToken): EmailVerificationTokenPersistenceRaw {
        return {
            _id: new Types.ObjectId(token.tokenId.toString()), // Convert domain ID string to ObjectId
            token: token.token,
            expiry: token.expiry.valueOf(), // Convert Date to timestamp
            errorAttempts: token.errorAttempts,
            email: token.email.value, // Extract email value
        };
    }
}
