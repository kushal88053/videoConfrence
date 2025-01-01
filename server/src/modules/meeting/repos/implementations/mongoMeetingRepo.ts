import { ObjectId } from 'mongodb';
import { BaseRepo } from '../../../../shared/infra/db/BaseRepo';
import { _db_connect_promise } from '../../../../shared/infra/db/connection';
import { Meeting } from '../../domain/meeting';
import { MeetingMap, MeetingPersistenceRaw } from '../../mappers/meetingMap';
import { IMeetingRepo } from '../meetingRepo';

export class MongoMeetingRepo extends BaseRepo implements IMeetingRepo {
    constructor() {
        super(_db_connect_promise, 'meetings');
    }

    async getMeetingByMeetingId(id: string): Promise<Meeting | undefined> {
        const meeting = await this.collection.findOne({
            _id: new ObjectId(id),
        }) as unknown as MeetingPersistenceRaw;
        return meeting ? MeetingMap.toDomain(meeting) : undefined;
    }

    async deleteMeetingByMeetingId(id: string): Promise<void> {
        await this.collection.findOneAndDelete({
            _id: new ObjectId(id),
        });
    }

    async setMeetingActiveCanvas(id: string, canvasId: string): Promise<void> {
        // This also validates that canvasId is among the canvasIds
        await this.collection.updateOne({ _id: new ObjectId(id), canvasIds: canvasId }, { $set: { activeCanvasId: canvasId } });
    }

    async insert(meeting: Meeting): Promise<void> {
        const raw = MeetingMap.toPersistence(meeting);
        await this.collection.insertOne({ ...raw, _id: new ObjectId(raw._id) });
    }

    async save(meeting: Meeting): Promise<void> {
        const raw = MeetingMap.toPersistence(meeting);
        await this.collection.updateOne({ _id: new ObjectId(raw._id) }, { $set: { ...raw } });
    }
}
