import { Result } from "../../../shared/core/Result";
import { BaseAPI } from "../../../shared/infra/services/BaseAPI";
import { signalingChannel } from "../../../shared/services/theme/signalling";
import { Chat } from "../models/chat";

export interface IChatService {
  sendChatMessage(chatId: string, content: string): Promise<Result<void>>;
  getChat(meetingId: string, chatId: string): Promise<Result<Chat>>;
}

class ChatService extends BaseAPI implements IChatService {
  async sendChatMessage(
    chatId: string,
    content: string
  ): Promise<Result<void>> {
    try {
      signalingChannel.emit("chat-message", chatId, {
        content,
      });
      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error) {
        return Result.fail(error.message);  // Accessing the message property of the Error object
      } else {
        return Result.fail("An unknown error occurred");  // Fallback for unknown errors
      }
    }
  }
  async getChat(meetingId: string, chatId: string): Promise<Result<Chat>> {
    try {
      const res = await this.get(`/chat/${meetingId}/${chatId}`);

      return Result.ok(res.data.chat);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return Result.fail(error.message);  // Accessing the message property of the Error object
      } else {
        return Result.fail("An unknown error occurred");  // Fallback for unknown errors
      }
    }
  }
}

export const chatService = new ChatService();
