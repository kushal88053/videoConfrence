import { isProduction } from "../../config";

console.log("isProduction:", isProduction);

export class Validators {
    public static isValidURL(url: string): boolean {
        // Regex for standard production URLs
        const productionRegex = /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})$/;

        // Regex for localhost URLs
        const localhostRegex = /^https?:\/\/localhost(:[0-9]{1,5})?$/;

        if (!isProduction) {
            // In development, accept both localhost and production URLs
            return localhostRegex.test(url.trim()) || productionRegex.test(url.trim());
        } else {
            // In production, accept only production URLs
            return productionRegex.test(url.trim());
        }
    }
}
