declare module 'react-color' {
    import * as React from 'react';

    export interface ColorResult {
        hex: string;
        rgb: { r: number; g: number; b: number; a: number };
        hsl: { h: number; s: number; l: number; a: number };
        hsv: { h: number; s: number; v: number; a: number };
    }

    export const SketchPicker: React.FC<{
        color: string;
        onChangeComplete: (color: ColorResult) => void;
        presetColors?: string[];
    }>;
}
