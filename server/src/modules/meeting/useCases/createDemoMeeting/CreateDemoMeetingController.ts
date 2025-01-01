import { BaseController, VideoAppRequest, VideoAppResponse } from '../../../../shared/infra/http/models/BaseController';
import { CreateMeetingResponseDTO } from '../createMeeting/CreateMeetingDTO';
import { CreateDemoMeetingUseCase } from './CreateDemoMeetingUseCase';
import path from 'path';

const filePath = path.basename(__filename);

export class CreateDemoMeetingController extends BaseController {
    private useCase: CreateDemoMeetingUseCase;

    constructor(useCase: CreateDemoMeetingUseCase) {
        super(null, null);
        this.useCase = useCase;
        console.log(`[${filePath}] Controller created with use case:`, useCase);
    }

    async executeImpl(req: VideoAppRequest, res: VideoAppResponse): Promise<void> {
        console.log(`[${filePath}] Executing controller with request:`, req);

        try {
            const result = await this.useCase.execute({});

            if (result.isLeft()) {
                const error = result.value;
                const e = error.errorValue();

                console.log(`[${filePath}] Error occurred:`, e);

                switch (error.constructor) {
                    default:
                        return res.fail();
                }
            } else {
                const dto: CreateMeetingResponseDTO = result.value;
                console.log(`[${filePath}] Successfully created meeting:`, dto);
                return res.created<CreateMeetingResponseDTO>(dto);
            }
        } catch (err) {
            console.log(`[${filePath}] Exception occurred:`, err);
            return res.fail();
        }
    }
}
