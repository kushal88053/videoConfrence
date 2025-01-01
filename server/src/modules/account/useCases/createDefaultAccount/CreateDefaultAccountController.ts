import { CreateDefaultAccountUseCase } from './CreateDefaultAccountUseCase';
import { createDefaultAccountBodySchema, CreateDefaultAccountDTO } from './CreateDefaultAccountDTO';

// Using console.log for logging
export class CreateDefaultAccountController {
    private useCase: CreateDefaultAccountUseCase;

    constructor(useCase: CreateDefaultAccountUseCase) {
        this.useCase = useCase;
    }

    async execute(): Promise<void> {
        // Log the start of the execution with file path and controller name
        console.log(`[${__filename}] [CreateDefaultAccountController] Starting the default account creation process.`);

        // Validate the environment variables for the account creation
        const data = createDefaultAccountBodySchema.validate({
            name: process.env['ACCOUNT_NAME'],
            label: process.env['ACCOUNT_LABEL'],
            secretKey: process.env['ACCOUNT_SECRET_KEY'],
            iconURL: process.env['ACCOUNT_ICON_URL'],
            redirectURI: process.env['ACCOUNT_REDIRECT_URI'],
            redirectURIs: process.env['ACCOUNT_REDIRECT_URIS']?.split(',').filter((url) => url.length > 0),
        });

        // Log validation success or failure
        if (data.error) {
            console.log(`[${__filename}] [CreateDefaultAccountController] Validation failed for default account creation data: ${data.error.details}`);
            return;
        } else {
            console.log(`[${__filename}] [CreateDefaultAccountController] Validation passed for default account data.`);
        }

        const dto: CreateDefaultAccountDTO = data.value;

        try {
            // Attempt to execute the use case to create the default account
            console.log(`[${__filename}] [CreateDefaultAccountController] Attempting to create default account with the validated data.`);
            const result = await this.useCase.execute(dto);

            // Check for errors and log accordingly
            if (result.isLeft()) {
                console.log(`[${__filename}] [CreateDefaultAccountController] Unable to create default account: ${result.value.errorValue()}`);
            } else {
                console.log(`[${__filename}] [CreateDefaultAccountController] Default account created or already exists.`);
            }
        } catch (err) {
            // Log any unexpected errors that occur during execution
            console.log(`[${__filename}] [CreateDefaultAccountController] Unexpected error while creating the default account: ${err}`);
        }
    }
}
