/* tslint:disable:no-unused-variable */
interface Console {
    time(reportName: string): void;
    timeEnd(reportName: string): void;
    assert(test: boolean, message: string, ...formatParams: any[]): void;
    info(message: any, ...formatParams: any[]): void;
    warn(message: any, ...formatParams: any[]): void;
    error(message: any, ...formatParams: any[]): void;
    log(message: any, ...formatParams: any[]): void;
    trace(): void;
    dump(obj: any): void;
    dir(obj: any): void;
}

interface WeakMap<K, V> {
    clear(): void;
    delete(key: K): boolean;
    get(key: K): V;
    has(key: K): boolean;
    set(key: K, value: V): WeakMap<K, V>;
}

declare var WeakMap: {
    new <K, V>(): WeakMap<K, V>;
}

declare var console: Console;
declare var global;
declare var require;

// Global functions
declare function Deprecated(target: Object, key?: string | symbol, value?: any): void;

declare function Log(data: any): void;
declare function log(data: any): void;
declare function float(num: number): any;
declare function long(num: number): any;
declare function fail(data: any): void;

declare var __dirname: string;
declare var __filename: string;

/**
 * Calls a function after a specified delay.
 * @param callback The function to be called.
 * @param milliseconds The time to wait before the function is called. Defaults to 0.
 */
declare function setTimeout(callback: Function, milliseconds?: number): number;

/**
 * Clears the delay set by a call to the setTimeout function.
 * @param id The identifier returned by the previously called setTimeout() method.
 */
declare function clearTimeout(id: number): void;

/**
 * Calls a function repeatedly with a delay between each call.
 * @param callback The function to be called.
 * @param milliseconds The delay between each function call.
 */
declare function setInterval(callback: Function, milliseconds?: number): number;

/**
 * Clears repeated function which was set up by calling setInterval().
 * @param id The identifier returned by the setInterval() method.
 */
declare function clearInterval(id: number): void;

declare class WeakRef<T> {
    constructor(obj: T);
    get(): T;
    clear(): void;
}

declare module module {
    var id: string;
    var filename: string;
    var exports: any;
}
// Same as module.exports
declare var exports: any;
