import { CreateAccountUseCase } from './CreateAccountUseCase';
import { createAccountBodyRequest, CreateAccountDTO, CreateAccountResponseDTO } from './CreateAccountDTO';
import { CreateAccountUseCaseErrors } from './CreateAccountErrors';
import { BaseController, VideoAppRequest, VideoAppResponse } from '../../../../shared/infra/http/models/BaseController';
import path from 'path';

export class CreateAccountController extends BaseController {

    private useCase: CreateAccountUseCase;

    constructor(useCase: CreateAccountUseCase) {
        super(createAccountBodyRequest, null);
        this.useCase = useCase;
        console.log('in CreateAccountController')
    }

    async executeImpl(req: VideoAppRequest<CreateAccountDTO>, res: VideoAppResponse): Promise<void> {
        const filePath = path.resolve(__filename); // Get the current file path for logging
        const dto = req.body;

        // Log the incoming request data (CreateAccountDTO)
        console.log(`[${filePath}]: Received request body:`, dto);

        try {
            console.log(`[${filePath}]: Calling useCase.execute with DTO:`, dto);
            const result = await this.useCase.execute(dto);

            // Check if the result is a failure (Left)
            if (result.isLeft()) {
                const error = result.value;
                const e = error.errorValue();

                console.error(`[${filePath}]: Use case failed with error:`, e.message);

                switch (error.constructor) {
                    case CreateAccountUseCaseErrors.AccountNameAlreadyInUseError:
                        console.warn(`[${filePath}]: Account name already in use:`, e.message);
                        return res.conflict(e.message);
                    case CreateAccountUseCaseErrors.InvalidPropertyError:
                        console.warn(`[${filePath}]: Invalid property error:`, e.message);
                        return res.forbidden(e.message);
                    case CreateAccountUseCaseErrors.InvalidEmailTokenError:
                        console.warn(`[${filePath}]: Invalid email token error:`, e.message);
                        return res.forbidden(e.message);
                    default:
                        console.error(`[${filePath}]: Unexpected error:`, e.message);
                        return res.fail();
                }
            } else {
                // If the result is a success (Right)
                const responseDto: CreateAccountResponseDTO = result.value;

                // Log the success response DTO
                console.log(`[${filePath}]: Use case succeeded, returning response:`, responseDto);
                return res.created<CreateAccountResponseDTO>(responseDto);
            }
        } catch (err) {
            // Catch unexpected errors
            console.error(`[${filePath}]: Unexpected error during execution:`, err);
            return res.fail();
        }
    }
}
