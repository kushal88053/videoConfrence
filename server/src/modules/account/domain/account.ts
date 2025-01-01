import { createHash, randomBytes } from 'crypto';
import { v4 as uuid } from 'uuid';
import { Guard } from '../../../shared/core/Guard';
import { Result } from '../../../shared/core/Result';
import { Entity } from '../../../shared/domain/Entity';
import { UniqueEntityID } from '../../../shared/domain/UniqueEntityID';

import { Validators } from '../../../shared/domain/Validator';
import path from 'path';
import { Types } from 'mongoose'; // Import Types from mongoose for ObjectId

const filePath = path.basename(__filename);

export interface AccountProps {
    name: string;
    label: string;
    iconURL?: string;
    secretKey?: string;
    redirectURIs: string[];
    defaultRedirectURI?: string;
}

export class Account extends Entity<AccountProps> {
    // _id is of type ObjectId from mongoose
    public _id!: UniqueEntityID;

    // Override the accountId getter to return the _id in the required ObjectId format
    get accountId(): UniqueEntityID {
        console.log(`[${filePath}] Accessing accountId:`, this._id);
        return this._id; // Directly return ObjectId
    }

    get name(): string {
        console.log(`[${filePath}] Accessing name:`, this.props.name);
        return this.props.name;
    }

    get label(): string {
        console.log(`[${filePath}] Accessing label:`, this.props.label);
        return this.props.label;
    }

    get secretKey(): string | undefined {
        console.log(`[${filePath}] Accessing secretKey:`, this.props.secretKey);
        return this.props.secretKey;
    }

    get iconURL(): string | undefined {
        console.log(`[${filePath}] Accessing iconURL:`, this.props.iconURL);
        return this.props.iconURL;
    }

    get redirectURIs(): string[] {
        console.log(`[${filePath}] Accessing redirectURIs:`, this.props.redirectURIs);
        return this.props.redirectURIs;
    }

    get defaultRedirectURI(): string | undefined {
        console.log(`[${filePath}] Accessing defaultRedirectURI:`, this.props.defaultRedirectURI);
        return this.props.defaultRedirectURI;
    }

    // Static method to generate a secret key
    private static generateSecretKey(): string {
        const key = createHash('sha256')
            .update(uuid())
            .update(randomBytes(256))
            .digest('hex');
        console.log(`[${filePath}] Generating a new secret key...`);
        const secretKey = `sk_live_${key}`;
        console.log(`[${filePath}] Generated secret key:`, secretKey);
        return `sk_live_${key}`;
    }

    // Static factory method to create an Account instance
    public static create(props: AccountProps, id?: UniqueEntityID): Result<Account> {
        console.log(`[${filePath}] Creating an Account instance with props:`, props, 'and id:', id);

        const guardResult = Guard.againstNullOrUndefinedBulk([
            { argument: props.name, argumentName: 'name' },
            { argument: props.label, argumentName: 'label' },
        ]);
        console.log(`[${filePath}] Guard result:`, guardResult);

        if (!guardResult.succeeded) {
            console.log(`[${filePath}] Guard validation failed:`, guardResult.message);
            return Result.fail(guardResult.message as string);
        }

        // Validate icon URL if provided
        if (props.iconURL && !Validators.isValidURL(props.iconURL)) {
            console.log(`[${filePath}] Invalid icon URL:`, props.iconURL);
            return Result.fail('Given icon URL is not a valid URL: ' + props.iconURL);
        }

        // Validate each redirect URI
        for (const url of props.redirectURIs) {
            console.log(`[${filePath}] Validating redirect URI:`, url);
            if (!Validators.isValidURL(url)) {
                console.log(`[${filePath}] Invalid redirect URI:`, url);
                return Result.fail('Given redirect URL is not a valid URL: ' + url);
            }
        }

        // Validate if the defaultRedirectURI is one of the registered redirect URIs
        if (props.defaultRedirectURI && !props.redirectURIs.includes(props.defaultRedirectURI)) {
            console.log(`[${filePath}] Default redirect URI: ${props.defaultRedirectURI} is not part of the redirect URIs.`);
            return Result.fail(
                `Given default redirect URL: ${props.defaultRedirectURI} is not valid as it is not registered as a redirect URI.`
            );
        }

        // Generate secret key if it's a new account
        const isNewAccount = !!id === false;
        console.log(`[${filePath}] Is this a new account?`, isNewAccount);

        const account = new Account(
            {
                ...props,
                secretKey: isNewAccount ? Account.generateSecretKey() : props.secretKey,
            },
            id || new UniqueEntityID() // Generate a new ObjectId if not provided
        );
        console.log(`[${filePath}] Account created successfully:`, account);
        console.log(`${filePath}] Close`);
        return Result.ok(account);
    }

    // Update the account with new properties
    public update(props: Partial<AccountProps>): Result<void> {
        const updatedProps = { ...this.props, ...props };

        const guardResult = Guard.againstNullOrUndefinedBulk([
            { argument: updatedProps.name, argumentName: 'name' },
            { argument: updatedProps.label, argumentName: 'label' },
        ]);

        if (!guardResult.succeeded) {
            return Result.fail(guardResult.message as string);
        }

        if (updatedProps.iconURL && !Validators.isValidURL(updatedProps.iconURL)) {
            return Result.fail('Given icon URL is not a valid URL: ' + updatedProps.iconURL);
        }

        for (const url of updatedProps.redirectURIs) {
            if (!Validators.isValidURL(url)) {
                return Result.fail('Given redirect URL is not a valid URL: ' + url);
            }
        }

        if (
            updatedProps.defaultRedirectURI &&
            !updatedProps.redirectURIs.includes(updatedProps.defaultRedirectURI)
        ) {
            return Result.fail(
                `Given default redirect URL: ${updatedProps.defaultRedirectURI} is not valid as it is not registered as a redirect URI.`
            );
        }

        this.props.name = updatedProps.name;
        this.props.label = updatedProps.label;
        this.props.iconURL = updatedProps.iconURL;
        this.props.redirectURIs = updatedProps.redirectURIs;
        this.props.defaultRedirectURI = updatedProps.defaultRedirectURI;

        return Result.ok<void>();
    }

    // A method to change the name of the account (as an example of update operation)
    public changeName(newName: string): Result<void> {
        if (!newName || newName.trim().length === 0) {
            return Result.fail('Name cannot be empty');
        }

        this.props.name = newName;
        return Result.ok<void>();
    }
}
