import { BaseController, VideoAppRequest, VideoAppResponse } from '../../../../shared/infra/http/models/BaseController';
import { GetMeetingDTO, getMeetingPathSchema } from './GetMeetingDTO';
import { GetMeetingUseCaseErrors } from './GetMeetingErrors';
import { GetMeetingUseCase } from './GetMeetingUseCase';

export class GetMeetingController extends BaseController {
    private useCase: GetMeetingUseCase;

    constructor(useCase: GetMeetingUseCase) {
        super(null, getMeetingPathSchema);
        this.useCase = useCase;
    }

    async executeImpl(req: VideoAppRequest<{}, GetMeetingDTO>, res: VideoAppResponse): Promise<void> {
        console.log('Received request:', {
            pathParams: req.pathParams,
        });

        const dto: GetMeetingDTO = {
            meetingId: req.pathParams.meetingId,
        };

        console.log('Prepared DTO:', dto);

        try {
            const result = await this.useCase.execute(dto);

            console.log('UseCase execution result:', result);

            if (result.isLeft()) {
                const error = result.value;
                const e = error.errorValue();

                console.log('Error occurred:', {
                    errorConstructor: error.constructor.name,
                    errorMessage: e.message,
                });

                switch (error.constructor) {
                    case GetMeetingUseCaseErrors.MeetingNotFoundError:
                        console.log('Meeting not found:', e.message);
                        return res.notFound(e.message);
                    default:
                        console.log('Unknown error occurred.');
                        return res.fail();
                }
            } else {
                console.log('Successfully retrieved meeting data:', result.value);
                return res.ok(result.value);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            return res.fail();
        }
    }
}
