import { defaultAccountName } from '../../../../config';
import { AppError } from '../../../../shared/core/AppError';
import { Either, left } from '../../../../shared/core/Result';
import { UseCase } from '../../../../shared/core/UseCase';
import { IAccountRepo } from '../../../account/repos/accountRepo';
import { CreateMeetingResponseDTO } from '../createMeeting/CreateMeetingDTO';
import { CreateMeetingUseCase } from '../createMeeting/CreateMeetingUseCase';
import { CreateDemoMeetingDTO } from './CreateDemoMeetingDTO';
import path from 'path';

const filePath = path.basename(__filename);

type Response = Either<AppError.UnexpectedError, CreateMeetingResponseDTO>;

export class CreateDemoMeetingUseCase implements UseCase<CreateDemoMeetingDTO, Promise<Response>> {
    private createMeetingUseCase: CreateMeetingUseCase;
    private accountRepo: IAccountRepo;

    constructor(createMeetingUseCase: CreateMeetingUseCase, accountRepo: IAccountRepo) {
        this.createMeetingUseCase = createMeetingUseCase;
        this.accountRepo = accountRepo;
        console.log(`[${filePath}] CreateDemoMeetingUseCase initialized with use case:`, createMeetingUseCase);
    }

    public async execute(request: CreateDemoMeetingDTO): Promise<Response> {
        console.log(`[${filePath}] Executing CreateDemoMeetingUseCase with request:`, request);

        try {
            const account = await this.accountRepo.getAccountByAccountName(defaultAccountName);
            console.log(`[${filePath}] Fetched account:`, account);

            const res = await this.createMeetingUseCase.execute({
                account: account!,
                title: 'Demo meeting',
                openingTime: {
                    startTS: new Date().valueOf(),
                    endTS: new Date().valueOf() + 5 * 60 * 1000,
                },
            });

            console.log(`[${filePath}] Meeting creation result:`, res);
            return res;
        } catch (err) {
            console.log(`[${filePath}] Error occurred:`, err);
            if (err instanceof Error) {
                return left(new AppError.UnexpectedError(err.message));
            }
            return left(new AppError.UnexpectedError('An unknown error occurred'));
        }
    }
}
