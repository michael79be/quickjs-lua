declare module 'os' {
    export const platform: string;
    export function exec(args: string[], options?: {
        stdout?: number,
        stderr?: number
    });
    export function pipe(): [number, number];
    export function read(handle: number, buffer: ArrayBuffer, pos: number, len: number);
    export function close(handle: number);
};
