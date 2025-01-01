import { Validators } from './Validator';

describe('Shared domain validators', () => {
    describe('isValidURL', () => {
        it('should return true for valid URLs', () => {
            const validURLs = ['https://nettu.no', 'http://nettu.no'];
            validURLs.forEach((url) => {
                expect(Validators.isValidURL(url)).toBe(true);
            });
        });

        it('should return false for invalid URLs', () => {
            const invalidURLs = ['://nettu.no', 'nettu', '', 'n', 'x.3'];
            invalidURLs.forEach((url) => {
                expect(Validators.isValidURL(url)).toBe(false);
            });
        });
    });
});
