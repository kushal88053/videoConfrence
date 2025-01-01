import { UseCaseError } from '../../../../shared/core/UseCaseError';
import { Result } from '../../../../shared/core/Result';
import path from 'path';

export namespace CreateAccountUseCaseErrors {
    export class AccountNameAlreadyInUseError extends Result<UseCaseError> {
        constructor(name: string) {
            const filePath = path.resolve(__filename); // Get the current file path for logging

            console.log(`[${filePath}]: Creating AccountNameAlreadyInUseError for name: ${name}`);

            super(false, {
                message: `Account names need to be unique and the name: ${name}, is already in use.`,
            } as UseCaseError);

            console.log(`[${filePath}]: AccountNameAlreadyInUseError created with message:`, this.errorValue().message);
        }
    }

    export class InvalidPropertyError extends Result<UseCaseError> {
        constructor(msg: string) {
            const filePath = path.resolve(__filename); // Get the current file path for logging

            console.log(`[${filePath}]: Creating InvalidPropertyError with message: ${msg}`);

            super(false, {
                message: `Invalid account property error: ${msg}`,
            } as UseCaseError);

            console.log(`[${filePath}]: InvalidPropertyError created with message:`, this.errorValue().message);
        }
    }

    export class InvalidEmailTokenError extends Result<UseCaseError> {
        constructor() {
            const filePath = path.resolve(__filename); // Get the current file path for logging

            console.log(`[${filePath}]: Creating InvalidEmailTokenError`);

            super(false, {
                message: `Provided email token is invalid.`,
            } as UseCaseError);

            console.log(`[${filePath}]: InvalidEmailTokenError created with message:`, this.errorValue().message);
        }
    }
}
