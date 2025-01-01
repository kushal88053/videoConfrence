import Joi from 'joi';

export interface GetCanvasDTO extends PathParamsSchema { }

export interface PathParamsSchema {
    canvasId: string;
}

export const pathParamsSchema = Joi.object({
    canvasId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/) // Regular expression for MongoDB ObjectId
        .required(),
});
