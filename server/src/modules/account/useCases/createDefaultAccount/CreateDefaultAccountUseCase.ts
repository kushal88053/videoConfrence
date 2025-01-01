import { AppError } from '../../../../shared/core/AppError';
import { Either, left, right } from '../../../../shared/core/Result';
import { UseCase } from '../../../../shared/core/UseCase';
import { Account } from '../../domain/account';
import { IAccountRepo } from '../../repos/accountRepo';
import { CreateDefaultAccountDTO } from './CreateDefaultAccountDTO';
import { CreateDefaultAccountUseCaseErrors } from './CreateDefaultAccountErrors';

type Response = Either<CreateDefaultAccountUseCaseErrors.InvalidPropertyError | AppError.UnexpectedError, string>;

export class CreateDefaultAccountUseCase implements UseCase<CreateDefaultAccountDTO, Promise<Response>> {
    private accountRepo: IAccountRepo;

    constructor(accountRepo: IAccountRepo) {
        this.accountRepo = accountRepo;
    }

    private log(message: string): void {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
    }

    public async execute(request: CreateDefaultAccountDTO): Promise<Response> {
        let account: Account | undefined;

        try {
            this.log(`Received request to create account: ${JSON.stringify(request)}`);

            account = await this.accountRepo.getAccountByAccountName(request.name);
            if (account !== undefined) {
                const message = 'Account already created';
                this.log(message);
                return right(message);
            }

            const accountWithKey = await this.accountRepo.getAccountBySecretKey(request.secretKey);
            if (accountWithKey !== undefined) {
                const message = 'Account already created';
                this.log(message);
                return right(message);
            }

            const redirectURIs = new Set(
                request.redirectURIs ? [...request.redirectURIs, request.redirectURI] : [request.redirectURI]
            );

            const accountOrErr = Account.create({
                label: request.label,
                name: request.name,
                iconURL: request.iconURL,
                redirectURIs: [...redirectURIs],
                defaultRedirectURI: request.redirectURI,
            });

            console.log("again in craeteDefaulAccountUseCase")

            if (accountOrErr.isFailure) {
                const errorMessage = `Invalid property error: ${accountOrErr.error as string}`;
                this.log(errorMessage);
                return left(new CreateDefaultAccountUseCaseErrors.InvalidPropertyError(accountOrErr.error as string));
            }

            console.log(accountOrErr);
            account = accountOrErr.getValue();
            account.props.secretKey = request.secretKey;

            await this.accountRepo.insert(account);

            const successMessage = 'Account successfully created';
            this.log(successMessage);
            return right(successMessage);
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? `Unexpected error: ${err.message}`
                    : 'An unexpected error occurred';
            this.log(errorMessage);
            return left(new AppError.UnexpectedError(errorMessage));
        }
    }
}
