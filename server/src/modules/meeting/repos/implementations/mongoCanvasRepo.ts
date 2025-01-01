import { BaseRepo } from '../../../../shared/infra/db/BaseRepo';
import { _db_connect_promise } from '../../../../shared/infra/db/connection';
import { Canvas } from '../../domain/canvas';
import { CanvasMap, CanvasPersistenceRaw } from '../../mappers/canvasMap';
import { ICanvasRepo } from '../canvasRepo';
import { ObjectId } from 'mongodb';

export class MongoCanvasRepo extends BaseRepo implements ICanvasRepo {
    constructor() {
        super(_db_connect_promise, 'canvas');
    }

    async setCanvasData(id: string, meetingId: string, data: string): Promise<void> {
        await this.collection.updateOne({ _id: new ObjectId(id), meetingId }, { $set: { data } });
    }

    async getCanvasByCanvasId(id: string): Promise<Canvas | undefined> {
        const canvas = await this.collection.findOne<CanvasPersistenceRaw>({
            _id: new ObjectId(id),
        });
        return canvas ? CanvasMap.toDomain(canvas) : undefined;
    }

    async insert(canvas: Canvas): Promise<void> {
        const raw = CanvasMap.toPersistence(canvas);
        await this.collection.insertOne({ ...raw, _id: new ObjectId(raw._id) });
    }

    async save(canvas: Canvas): Promise<void> {
        const raw = CanvasMap.toPersistence(canvas);
        await this.collection.updateOne({ _id: new ObjectId(raw._id) }, { $set: { ...raw } });
    }
}
