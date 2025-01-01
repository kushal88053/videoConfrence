import { BaseRepo } from '../../../../shared/infra/db/BaseRepo';
import { _db_connect_promise } from '../../../../shared/infra/db/connection';
import { Account } from '../../domain/account';
import { AccountMap, AccountPersistenceRaw } from '../../mappers/accountMap'; // Ensure this import
import { IAccountRepo } from '../accountRepo';
import { ObjectId } from 'mongodb'; // Ensure this import is included

export class MongoAccountRepo extends BaseRepo implements IAccountRepo {
    constructor() {
        super(_db_connect_promise, 'accounts');
    }

    async getAccountByAccountId(id: string): Promise<Account | undefined> {
        const account = await this.collection.findOne({
            _id: new ObjectId(id),
        }) as AccountPersistenceRaw | null;
        if (account === null) {
            return undefined;
        }
        return AccountMap.toDomain(account) ?? undefined;
    }

    async getAccountByAccountName(name: string): Promise<Account | undefined> {
        const account = await this.collection.findOne({
            name,
        }) as AccountPersistenceRaw | null;
        return account ? (AccountMap.toDomain(account) ?? undefined) : undefined;
    }

    async getAccountBySecretKey(key: string): Promise<Account | undefined> {
        const account = await this.collection.findOne({
            secretKey: key,
        }) as AccountPersistenceRaw | null;
        return account ? (AccountMap.toDomain(account) ?? undefined) : undefined;
    }

    async insert(account: Account): Promise<void> {
        const raw = AccountMap.toPersistence(account);
        await this.collection.insertOne({ ...raw, _id: new ObjectId(raw._id) });
    }

    async save(account: Account): Promise<void> {
        const raw = AccountMap.toPersistence(account);
        await this.collection.updateOne({ _id: new ObjectId(raw._id) }, { $set: { ...raw } });
    }
}