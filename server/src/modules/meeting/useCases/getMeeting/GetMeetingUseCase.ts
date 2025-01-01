import { AppError } from '../../../../shared/core/AppError';
import { Either, left, right } from '../../../../shared/core/Result';
import { UseCase } from '../../../../shared/core/UseCase';
import { AccountMap } from '../../../account/mappers/accountMap';
import { IAccountRepo } from '../../../account/repos/accountRepo';
import { Meeting } from '../../domain/meeting';
import { MeetingMap } from '../../mappers/meetingMap';
import { IMeetingRepo } from '../../repos/meetingRepo';
import { GetMeetingDTO, GetMeetingResponseDTO } from './GetMeetingDTO';
import { GetMeetingUseCaseErrors } from './GetMeetingErrors';

type Response = Either<GetMeetingUseCaseErrors.MeetingNotFoundError | AppError.UnexpectedError, GetMeetingResponseDTO>;

export class GetMeetingUseCase implements UseCase<GetMeetingDTO, Promise<Response>> {
    private meetingRepo: IMeetingRepo;
    private accountRepo: IAccountRepo;

    constructor(meetingRepo: IMeetingRepo, accountRepo: IAccountRepo) {
        this.meetingRepo = meetingRepo;
        this.accountRepo = accountRepo;
    }

    public async execute(request: GetMeetingDTO): Promise<Response> {
        console.log('Executing GetMeetingUseCase with request:', request);

        let meeting: Meeting | undefined;

        try {
            console.log('Fetching meeting by meetingId:', request.meetingId);
            meeting = await this.meetingRepo.getMeetingByMeetingId(request.meetingId);

            if (!meeting) {
                console.warn('Meeting not found:', request.meetingId);
                return left(new GetMeetingUseCaseErrors.MeetingNotFoundError(request.meetingId as string));
            }

            console.log('Meeting found:', meeting);

            console.log('Fetching account by accountId:', meeting.account.accountId);
            const comp = await this.accountRepo.getAccountByAccountId(meeting.account.accountId);

            if (!comp) {
                console.warn('Account not found for accountId:', meeting.account.accountId);
            } else {
                console.log('Account found:', comp);
            }

            const response: GetMeetingResponseDTO = {
                meeting: MeetingMap.toDTO(meeting),
                account: AccountMap.toDTO(comp!),
            };

            console.log('Mapped response DTO:', response);

            return right(response);
        } catch (err) {
            console.error('An error occurred during GetMeetingUseCase execution:', err);

            if (err instanceof Error) {
                return left(new AppError.UnexpectedError(err.message));
            }

            return left(new AppError.UnexpectedError('An unexpected error occurred'));
        }
    }
}
