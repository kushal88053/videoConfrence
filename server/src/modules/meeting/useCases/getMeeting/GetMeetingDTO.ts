import Joi from 'joi';
import { AccountDTO } from '../../../account/dtos/accountDTO';
import { MeetingDTO } from '../../dtos/meetingDTO';

export interface GetMeetingDTO {
    meetingId: string;
}

export const getMeetingPathSchema = Joi.object({
    meetingId: Joi.string()
        .pattern(/^[a-fA-F0-9]{24}$/) // Regular expression for MongoDB ObjectId
        .required(),
}).optional();

export interface GetMeetingResponseDTO {
    meeting: MeetingDTO;
    account: AccountDTO;
}
