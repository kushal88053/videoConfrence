import { AppError } from '../../../../shared/core/AppError';
import { Either, left, right } from '../../../../shared/core/Result';
import { UseCase } from '../../../../shared/core/UseCase';
import { IEmailTokenVerificationRepo } from '../../../user/repos/emailTokenVerificationRepo';
import { ValidateEmailVerificationCodeUseCase } from '../../../user/useCases/validateEmailVerificationCode/ValidateEmailVerificationCodeUseCase';
import { Account } from '../../domain/account';
import { IAccountRepo } from '../../repos/accountRepo';
import { CreateAccountDTO, CreateAccountResponseDTO } from './CreateAccountDTO';
import { CreateAccountUseCaseErrors } from './CreateAccountErrors';
import path from 'path';

type Response = Either<
    | CreateAccountUseCaseErrors.AccountNameAlreadyInUseError
    | CreateAccountUseCaseErrors.InvalidPropertyError
    | CreateAccountUseCaseErrors.InvalidEmailTokenError
    | AppError.UnexpectedError,
    CreateAccountResponseDTO
>;


export class CreateAccountUseCase implements UseCase<CreateAccountDTO, Promise<Response>> {
    private emailVerificationUseCase: ValidateEmailVerificationCodeUseCase;
    private accountRepo: IAccountRepo;
    private emailTokenRepo: IEmailTokenVerificationRepo;

    constructor(
        emailVerificationUseCase: ValidateEmailVerificationCodeUseCase,
        accountRepo: IAccountRepo,
        emailTokenRepo: IEmailTokenVerificationRepo,
    ) {
        this.emailVerificationUseCase = emailVerificationUseCase;
        this.accountRepo = accountRepo;
        this.emailTokenRepo = emailTokenRepo;
    }

    public async execute(request: CreateAccountDTO): Promise<Response> {
        let account: Account | undefined;
        const filePath = path.resolve(__filename); // Get the current file path for logging

        console.log(`[${filePath}]: Starting CreateAccountUseCase execution with request:`, request);

        try {
            // Validate the email token
            console.log(`[${filePath}]: Validating email token:`, request.emailToken);
            const validatedOrErr = await this.emailVerificationUseCase.execute({
                code: request.emailToken.code,
                email: request.emailToken.email,
            });

            if (validatedOrErr.isLeft()) {
                console.log(`[${filePath}]: Invalid email token`);
                return left(new CreateAccountUseCaseErrors.InvalidEmailTokenError());
            }

            const emailToken = validatedOrErr.value;
            console.log(`[${filePath}]: Email token validated:`, emailToken);

            // Check if account name is already in use
            account = await this.accountRepo.getAccountByAccountName(request.name);
            if (account !== undefined) {
                console.log(`[${filePath}]: Account name "${request.name}" is already in use`);
                return left(new CreateAccountUseCaseErrors.AccountNameAlreadyInUseError(request.name));
            }

            // Create the account
            const accountOrErr = Account.create({
                label: request.label,
                name: request.name,
                redirectURIs: typeof request.redirectURIs === 'object' ? request.redirectURIs : [],
                defaultRedirectURI: request.defaultRedirectURI,
            });

            console.log('check', {
                label: request.label,
                name: request.name,
                redirectURIs: typeof request.redirectURIs === 'object' ? request.redirectURIs : [],
                defaultRedirectURI: request.defaultRedirectURI,
            });

            if (accountOrErr.isFailure) {
                console.log(`[${filePath}]: Invalid property while creating account:`, accountOrErr.error);
                return left(new CreateAccountUseCaseErrors.InvalidPropertyError(accountOrErr.error as string));
            }

            console.log(accountOrErr);

            account = accountOrErr.getValue();
            console.log(`[${filePath}]: Account created successfully:`, account);

            // Insert the account into the repository and delete the email token
            console.log(`[${filePath}]: Inserting account into the repository:`, account);
            await this.accountRepo.insert(account);

            console.log(`[${filePath}]: Deleting email token with tokenId:`, emailToken.tokenId);
            await this.emailTokenRepo.deleteByTokenId(emailToken.tokenId);

            // Return the success response
            console.log(`[${filePath}]: Account creation successful, returning secretKey`);
            return right({
                secretKey: account.secretKey!,
            });
        } catch (err) {
            console.log(`[${filePath}]: Unexpected error during account creation:`, err);
            return left(new AppError.UnexpectedError((err as Error).toString()));
        }
    }
}
