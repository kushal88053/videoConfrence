import Joi from 'joi';

export interface CreateAccountDTO {
    emailToken: {
        email: string;
        code: string;
    };
    name: string;
    label: string;
    redirectURIs: string[];
    defaultRedirectURI: string;
}

export interface CreateAccountResponseDTO {
    secretKey: string;
}

const emailToken = Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().required(),
});

export const createAccountBodyRequest: Joi.ObjectSchema<CreateAccountDTO> = Joi.object({
    emailToken: emailToken.required(),
    name: Joi.string().required(),
    label: Joi.string().required(),
    redirectURIs: Joi.array().items(Joi.string().required()).required(),
    defaultRedirectURI: Joi.string().required(),
});
