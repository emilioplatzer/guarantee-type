export type Description = 'string'|'number'

export type GuaranteedType<CurrentD extends Description> =
    CurrentD extends 'string' ? string :
    never;

export function guarantee<CurrentD extends Description>(description:CurrentD, value:any):GuaranteedType<CurrentD>{
    if ( description == 'string' && typeof value != 'string') throw new Error(`guarantee excpetion. Value is not proper type`);
    return value;
}