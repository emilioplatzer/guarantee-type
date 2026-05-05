export type Literal = number | string | boolean | null
export type Values = 'string'|'number'|'boolean'|'bigint'|'symbol'
export type Keys = Values | 'recordString' | 'nullable' | 'optional' | 'object' | 'array' | 'class' | 'union' | 'literal'

export type Opts = {};

export type Description = 
    { string : Opts } |
    { number : Opts } |
    { boolean: Opts } |
    { bigint : Opts } |
    { symbol : Opts } |
    { recordString : Description } |
    { nullable: Description } |
    { optional: Description } |
    { array: Description } | 
    { union: Description [] } | 
    { class: Function } | 
    { literal: Literal } |
    { object: {[K in keyof any]: Description} } 

export type Constructor<T> = new(...args: any[]) => T;

// ─── helpers para object con opcionalidad correcta ────────────────────────────

type OptionalKeys<T> = {
    [K in keyof T]: T[K] extends { optional: any } ? K : never
}[keyof T]

type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never

type ObjectDefinedType<T> = Expand<
    { [K in RequiredKeys<T>]: T[K] extends Description ? DefinedType<T[K]> : unknown }
    & 
    { [K in OptionalKeys<T>]?: T[K] extends { optional: infer Inner }
        ? Inner extends Description ? DefinedType<Inner> : unknown
        : unknown 
    }
>

// ─── tipo base: solo primitivos y class, sin recursión ────────────────────────

export type SimpleDefinedType<TDescription extends Description> = 
    TDescription extends { string : Opts }   ? string  :
    TDescription extends { number : Opts }   ? number  :
    TDescription extends { boolean: Opts }   ? boolean :
    TDescription extends { bigint : Opts }   ? bigint  :
    TDescription extends { symbol : Opts }   ? symbol  :
    TDescription extends { class: infer T }  ? ( T extends Constructor<any> ? InstanceType<T> : unknown ) : 
    TDescription extends { literal: (infer T1 extends string | number | boolean | null) } ? T1 :
    never

// ─── tipo principal: único punto de recursión ─────────────────────────────────

export type DefinedType<TDescription extends Description> = 
    TDescription extends { recordString: infer T }  ? ( T extends Description ? Record<string, DefinedType<T>> : unknown) :
    TDescription extends { union: (infer T)[] }      ? ( T extends Description ? DefinedType<T> : unknown) :
    TDescription extends { object: infer T }         ? ObjectDefinedType<T> :
    TDescription extends { array: infer T }          ? ( T extends Description ? DefinedType<T>[] : unknown ) :
    TDescription extends { nullable: infer T }       ? ( T extends Description ? DefinedType<T> | null : unknown ) :
    TDescription extends { optional: infer T }       ? ( T extends Description ? DefinedType<T> | undefined : unknown ) :
    SimpleDefinedType<TDescription>

// ─── alias público para compatibilidad ───────────────────────────────────────

/** @deprecated use DefinedType instead */
export type GuaranteedType<T extends Description> = DefinedType<T>

// ─── runtime ──────────────────────────────────────────────────────────────────

export function valueGuarantor(type:Values){
    return function guarantor(_opts:Opts, value:any, path:string, errors:string[]){
        if ( (typeof value != type) ) errors.push(`${path} is not "${type}"`);
    }
}

export var errorTypeFinder = {
    string :valueGuarantor('string'),
    number :valueGuarantor('number'),
    boolean:valueGuarantor('boolean'),
    bigint :valueGuarantor('bigint'),
    symbol :valueGuarantor('symbol'),
    recordString: function(innerDescription:Description, value:any, path:string, errors:string[]){
        if(!(value instanceof Array) && (value instanceof Object) && value){
            for (var a in value) {
                findErrorsInTypes(innerDescription, value[a], path+`[${a}]`, errors);
            }
        }else errors.push(`${path} is not a Record<string,T> and must be`);
    },
    object: function(innerDescription:{[K:string] : Description}, value:any, path:string, errors:string[]){
        for ( var a in innerDescription ){
            findErrorsInTypes(innerDescription[a], value[a], path+'.'+a, errors);
        }
    },
    array: function(innerDescription:Description, value:any, path:string, errors:string[]){
        if(value instanceof Array){
            for ( var i = 0; i < value.length; i++ ){
                findErrorsInTypes(innerDescription, value[i], path+`[${i}]`, errors);
            }
        }else errors.push(`${path} is not an array and must be`);
    },
    union: function(descriptions:Description[], value:any, path:string, errors:string[]){
        var incompatibilities:string[] = []; 
        var step = 0;
        for(var n in descriptions){
            findErrorsInTypes(descriptions[n], value, `${path}(in union)`, incompatibilities);
            if(step++ == incompatibilities.length) return;
        }
        for(var i=0; i<incompatibilities.length; i++) errors.push(incompatibilities[i]);
    },
    class: function guarantor(classConstructor:Function, value:any, path:string, errors:string[]){
        if ( !(value instanceof classConstructor) ) errors.push(`${path} is not "${
            /* istanbul ignore next */
            classConstructor.name??'class'
        }"`);
    },
    literal: function guarantor(description: Literal, value:any, path:string, errors:string[]){
        if (value != description) errors.push(`${path} is not "${description}"`);
    }
} satisfies Partial<Record<Keys, (classConstructor:any, value:any, path:string, errors:string[]) => void>>

function findErrorsInTypes<CurrentD extends Description>(description:CurrentD, value:any, path:string, errors:string[]):void{
    if ( "nullable" in description ){
        if ( value === null ) return value
        else
            return findErrorsInTypes(description.nullable, value, path, errors);
    }else if ( "optional" in description){
        if ( value == null ) return value
        else
            return findErrorsInTypes(description.optional, value, path, errors);
    }else{
        if ( value == null ) errors.push(`${path} is ${value} but type is not nullable`)
        else 
        for(var firstTag in description){
            if(firstTag in errorTypeFinder){
                var theTag = firstTag as unknown as keyof typeof errorTypeFinder;
                // @ts-expect-error description[firstTag] may or may not be the expected type
                errorTypeFinder[theTag](description[firstTag], value, path, errors);
            }else{
                errors.push(`${firstTag} is not a valid type`)
            }
            return;
        }
    }
}

export function throwAllErrorsInAString(errors:string[]){
    if(errors.length) throw new Error(`guarantee exception. ${errors.join(', ')}`);
}

export function consoleErrorAllErrors(errors:string[]){
    if(errors.length) console.error(`guarantee errors.`,errors);
}

export function ignoreAllErrors(_errors:string[]){
}

var guaranteeOnErrorListener:(errors:string[]) => void = throwAllErrorsInAString;

export function guaranteeOnError(fun:(errors:string[]) => void){
    guaranteeOnErrorListener = fun;
}

export function guarantee<CurrentD extends Description>(description:CurrentD, value:NoInfer<any>):DefinedType<CurrentD>{
    var errors:string[] = []
    findErrorsInTypes(description, value, 'Value', errors);
    guaranteeOnErrorListener(errors);
    return value;
}

export var nullOpts:Opts = {}

type IS1 = {
    string   : {string:Opts},
    number   : {number:Opts},
    boolean  : {boolean:Opts},
    bigint   : {bigint:Opts},
    symbol   : {symbol:Opts},
    class    : <T>(c: Constructor<T>) => {class: Constructor<T>},
}

type IS2 = IS1 & {
    object   : <T>(descriptions:T)=>( {object:T} )
    Date     : {class: Constructor<Date>}
}

type IS = IS2 & {
    recordString: {[k in keyof IS1]: {recordString:Pick<IS1,k>}} & {
        nullable : {[k in keyof IS1]: {recordString:{nullable:Pick<IS1,k>}}},
        optional : {[k in keyof IS1]: {recordString:{optional:Pick<IS1,k>}}},
    } & {
        object:<T>(descriptions:T)=>( {recordString:{object:T}} )
    },
    nullable : {[k in keyof IS1]: {nullable:Pick<IS1,k>}} & {
        array : {[k in keyof IS1]: {nullable:{array:Pick<IS1,k>}}},
    } & {
        object:<T>(descriptions:T)=>( {nullable:{object:T}} )
    } & {
        Date: {nullable:{class: Constructor<Date>}} 
    },
    optional : {[k in keyof IS1]: {optional:Pick<IS1,k>}} & {
        array : {[k in keyof IS1]: {optional:{array:Pick<IS1,k>}}},
    } & {
        object:<T>(descriptions:T)=>( {optional:{object:T}} )
    } & {
        recordString : {[k in keyof IS1]: {optional:{recordString:Pick<IS1,k>}}},
    },
    array: {[k in keyof IS1]: {array:Pick<IS1,k>}} & {
        nullable : {[k in keyof IS1]: {array:{nullable:Pick<IS1,k>}}},
        optional : {[k in keyof IS1]: {array:{optional:Pick<IS1,k>}}},
    } & {
        object:<T>(descriptions:T)=>( {array:{object:T}} )
    },
    union: <T>(description:T[]) => ( {union: T[]}),
    literal: <T extends Literal>(description:T) => ( {literal: T} )
}

export var is:IS = {
    string   : {string  : {}},
    number   : {number  : {}},
    boolean  : {boolean : {}},
    bigint   : {bigint  : {}},
    symbol   : {symbol  : {}},
    // @ts-ignore TODO!!!!
    get recordString(){ return isModificator(['recordString'])},
    // @ts-ignore TODO!!!!
    get nullable(){ return isModificator(['nullable'])},
    // @ts-ignore TODO!!!!
    get optional(){ return isModificator(['optional'])},
    object   : <T>(descriptions:T)=>( {object:descriptions}),
    // @ts-ignore TODO!!!!
    get array(){ return isModificator(['array'])},
    union    : <T>(description:T[]) => ( {union: description} ),
    literal  : <T extends Literal>(description:T) => ( {literal: description} ),
    class    : <T>(c:Constructor<T>) => ({class: c}),
    Date     : {class: Date}
}

const IS_PROXIED = Symbol('IS_PROXIED')

function isModificator(name:(keyof IS)[]): IS {
    var proxy = new Proxy(is, {
        get(_target, prop:keyof IS | typeof IS_PROXIED, _receiver) {
            if(prop==IS_PROXIED){
                return true;
            }else{
                var value = is[prop];
                // @ts-expect-error IS_PROXIED is an internal flag for chain propierties
                if(value[IS_PROXIED]){
                    return isModificator([...name, prop]);
                }else{
                    var wrap = (value:any) => {
                        for(var i=name.length-1; i>=0; i--){
                            value = {[name[i]]: value} as Description;
                        }
                        return value;
                    }
                    if (prop == 'object') {
                        return (x:any) => wrap({object: x})
                    } else {
                        return wrap(value)
                    }
                }
            }
        }        
    });
    return proxy;
}

export function jsonParse<T extends Description>(description:T, jsonString:string): DefinedType<T>{
    var parsedObject = JSON.parse(jsonString);
    return guarantee(description, parsedObject) as DefinedType<T>;
}
