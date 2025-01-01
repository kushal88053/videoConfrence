import { BaseRepo } from '../../../../shared/infra/db/BaseRepo';
import { _db_connect_promise } from '../../../../shared/infra/db/connection';
import { Chat, ChatMessage } from '../../domain/chat';
import { ChatMap, ChatPersistenceRaw } from '../../mappers/chatMap';
import { ChatMessageMap } from '../../mappers/chatMessageMap';
import { IChatRepo } from '../chatRepo';
import { ObjectId } from 'mongodb';

export class MongoChatRepo extends BaseRepo implements IChatRepo {
    constructor() {
        super(_db_connect_promise, 'chats');
    }

    async insertMessage(chatId: string, chatMessage: ChatMessage): Promise<void> {
        const raw = ChatMessageMap.toPersistence(chatMessage);
        await this.collection.findOneAndUpdate(
            {
                _id: new ObjectId(chatId),
            },
            {
                $push: {
                    messages: chatMessage,
                } as any,
            },
        );
    }

    async getChatByChatId(id: string): Promise<Chat | undefined> {
        const chat = await this.collection.findOne<ChatPersistenceRaw>({
            _id: new ObjectId(id),
        });
        return chat ? ChatMap.toDomain(chat) : undefined;
    }

    async insert(chat: Chat): Promise<void> {
        const raw = ChatMap.toPersistence(chat);
        await this.collection.insertOne({ ...raw, _id: new ObjectId(raw._id) });
    }

    async save(chat: Chat): Promise<void> {
        const raw = ChatMap.toPersistence(chat);
        await this.collection.updateOne({ _id: new ObjectId(raw._id) }, { $set: { ...raw } });
    }
}
