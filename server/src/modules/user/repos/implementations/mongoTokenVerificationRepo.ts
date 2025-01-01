import { UniqueEntityID } from '../../../../shared/domain/UniqueEntityID';
import { BaseRepo } from '../../../../shared/infra/db/BaseRepo';
import { _db_connect_promise } from '../../../../shared/infra/db/connection';
import { EmailVerificationToken } from '../../domain/emailTokenVerification';
import { EmailVerificationTokenMap, EmailVerificationTokenPersistenceRaw } from '../../mappers/emailVerificationTokenMap';
import { IEmailTokenVerificationRepo } from '../emailTokenVerificationRepo';
import { ObjectId } from 'mongodb';
import path from 'path';

export class MongoEmailTokenVerificationRepoRepo extends BaseRepo implements IEmailTokenVerificationRepo {
    constructor() {
        super(_db_connect_promise, 'emailTokens');
    }

    async getTokenByEmail(email: string): Promise<EmailVerificationToken | undefined> {
        const filePath = path.resolve(__filename);
        console.log(`[${filePath}]: Fetching token by email: ${email}`);

        const emailToken = await this.collection.findOne({
            email,
        }) as unknown as EmailVerificationTokenPersistenceRaw;

        console.log(`[${filePath}]: Token fetched:`, emailToken);

        return emailToken ? EmailVerificationTokenMap.toDomain(emailToken) : undefined;
    }

    async insert(emailTokenVerification: EmailVerificationToken): Promise<void> {
        const filePath = path.resolve(__filename);
        const raw = EmailVerificationTokenMap.toPersistence(emailTokenVerification);

        // Log raw data before insertion
        console.log(`[${filePath}]: Raw data before insertion:`, raw);

        try {
            await this.collection.insertOne({ ...raw, _id: new ObjectId() });
            console.log(`[${filePath}]: Successfully inserted token:`, raw);
        } catch (error) {
            console.error(`[${filePath}]: Error inserting token:`, error);
        }
    }

    async save(emailTokenVerification: EmailVerificationToken): Promise<void> {
        const filePath = path.resolve(__filename);
        const raw = EmailVerificationTokenMap.toPersistence(emailTokenVerification);

        // Log raw data before updating
        console.log(`[${filePath}]: Raw data before update:`, raw);

        try {
            await this.collection.updateOne({ _id: new ObjectId(raw._id) }, { $set: { ...raw } });
            console.log(`[${filePath}]: Successfully updated token:`, raw);
        } catch (error) {
            console.error(`[${filePath}]: Error updating token:`, error);
        }
    }

    async deleteByTokenId(tokenId: UniqueEntityID): Promise<void> {
        const filePath = path.resolve(__filename);
        console.log(`[${filePath}]: Deleting token with tokenId:`, tokenId.toValue());

        try {
            await this.collection.deleteOne({ _id: new ObjectId(tokenId.toValue()) });
            console.log(`[${filePath}]: Successfully deleted token:`, tokenId.toValue());
        } catch (error) {
            console.error(`[${filePath}]: Error deleting token:`, error);
        }
    }
}
