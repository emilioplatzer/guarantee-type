
export type Values = 'string'|'number'|'boolean'|'bigint'|'symbol'
export type Keys = Values | 'nullable' | 'optional' | 'object' | 'array' | 'class' | 'union' 

export type Opts = any;

export type Description = 
    { string : Opts } |
    { number : Opts } |
    { boolean: Opts } |
    { bigint : Opts } |
    { symbol : Opts } |
    { nullable: Description } |
    { optional: Description } |
    { object: {[K in keyof any]: Description} } | 
    { array: Description } | 
    { union: Description [] } | 
    { class: Function }

export type Constructor<T> = new(...args: any[]) => T;

export type DefinedType<Description> = 
    Description extends { string : Opts } ? string  :
    Description extends { number : Opts } ? number  :
    Description extends { boolean: Opts } ? boolean :
    Description extends { bigint : Opts } ? bigint  :
    Description extends { symbol : Opts } ? symbol  :
    Description extends { nullable: infer T } ? DefinedType<T>|null :
    Description extends { optional: infer T } ? DefinedType<T>|null|undefined :
    Description extends { object: infer T} ? {[K in keyof T] : DefinedType<T[K]>} :
    Description extends { array: infer T} ? DefinedType<T>[] :
    Description extends { union: (infer T1) [] } ? DefinedType<T1> :
    Description extends { class: infer T } ? ( T extends Constructor<any> ? InstanceType<T> : unknown ) : 
    unknown

export function valueGuarantor(type:Values){
    return function guarantor(_opts:Opts, value:any, path:string, errors:string[]){
        if ( (typeof value != type) ) errors.push(`${path} is not "${type}"`);
    }
}

export var errorTypeFinder = {
    // nullable: function(){},
    // optiontal: function(){},
    string :valueGuarantor('string'),
    number :valueGuarantor('number'),
    boolean:valueGuarantor('boolean'),
    bigint :valueGuarantor('bigint'),
    symbol :valueGuarantor('symbol'),
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
        /* array implementation:
        for(var i=0; i<descriptions.length; i++){
            findErrorsInTypes(descriptions[i], value, `${path}(in union)`, incompatibilities);
            if(incompatibilities.length == i) return;
        }
        */
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
                errorTypeFinder[theTag](description[firstTag], value, path, errors);
            }else{
                errors.push(`${firstTag} is not a valid type`)
            }
            return;
        }
        /* else if ( description instanceof Array ) {
            var unionErrors:string[] = []
            for (var alternative of description) {
                var alternativeErrors:string[] = []
                var alternativeValue = findErrorsInTypes(alternative, value, path, alternativeErrors)
                if (alternativeErrors.length == 0) return alternativeValue
                unionErrors = unionErrors.concat(alternativeErrors);
            }
            errors.push
        } */ 
        /*
        else {
            var theTag: keyof typeof errorTypeFinder | null = null
            var theDescription: CurrentD | null = null;
            if (description instanceof Array) {
                theTag = "union"
                theDescription = description;
            } else {
                for (var firstTag in description) {
                    if (firstTag in errorTypeFinder) {
                        // @ts-expect-error This should not be an error because firstTag is in errorTypeFinder then it is keyof typeof errorTypeFinder
                        theTag = firstTag
                        // @ts-expect-error This is an error because CurrentD can be an array
                        theDescription = description[theTag]
                    } else {
                        errors.push(`${firstTag} is not a valid type`);
                        return; 
                    }
                    break;
                }
            }
            if (theTag == null) return;
            errorTypeFinder[theTag](theDescription, value, path, errors);
        } */

    }
}

export function throwAllErrorsInAString(errors:string[]){
    if(errors.length) throw new Error(`guarantee excpetion. ${errors.join(', ')}`);
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

export function guarantee<CurrentD extends Description>(description:CurrentD, value:any):DefinedType<CurrentD>{
    var errors:string[] = []
    findErrorsInTypes(description, value, 'Value', errors);
    guaranteeOnErrorListener(errors);
    return value;
}

export var nullOpts:Opts = {}
/*
type IS = {
    string   : {string:Opts},
    number   : {number:Opts},
    boolean  : {boolean:Opts},
    bigint   : {bigint:Opts},
    symbol   : {symbol:Opts},
    class    : (c: Constructor<any>)=>Description,
    Date     : Description,
    // object   : <T>(descriptions:{[K in keyof T]: T[K]})=>( {object:{[K in keyof T]: T[K]}})
    object   : <T>(descriptions:T)=>( {object:T} )
    nullable : {[k in keyof IS]: {nullable:Pick<IS,k>}},
    optional : {[k in keyof IS]: {optional:Pick<IS,k>}},
    array    : {[k in keyof IS]: {array   :Pick<IS,k>}},
    // union    : Description
}
*/

type IS1 = {
    string   : {string:Opts},
    number   : {number:Opts},
    boolean  : {boolean:Opts},
    bigint   : {bigint:Opts},
    symbol   : {symbol:Opts},
    class    : (c: Constructor<any>)=>Description,
    Date     : Description,
    object   : <T>(descriptions:T)=>( {object:T} )
}

type IS2 = IS1 & {
}

type IS = IS2 & {
    nullable : {[k in keyof IS1]: {nullable:Pick<IS1,k>}} & {
        array : {[k in keyof IS1]: {nullable:{array:Pick<IS1,k>}}},
    },
    optional : {[k in keyof IS1]: {optional:Pick<IS1,k>}} & {
        array : {[k in keyof IS1]: {nullable:{array:Pick<IS1,k>}}},
    },
    array: {[k in keyof IS1]: {array:Pick<IS1,k>}} & {
        nullable : {[k in keyof IS1]: {array:{nullable:Pick<IS1,k>}}},
        optional : {[k in keyof IS1]: {array:{optional:Pick<IS1,k>}}},
    } ,
    // union    : Description
}

/*
type IS2 = IS1 & {
    nullable : {[k in keyof IS1]: {nullable:Pick<IS1,k>}},
    optional : {[k in keyof IS1]: {optional:Pick<IS1,k>}},
    array    : {[k in keyof IS1]: {array   :Pick<IS1,k>}},
}

type I3={
    optional : {optional:IS},
    object   : <T>(o:{[K in keyof T]: T[K]})=>{ object: {[K in keyof T]: T[K]} },
    array    : {array:IS},
    union    : Description,
    
}
*/

export var is:IS = {
    string   : {string  : {}},
    number   : {number  : {}},
    boolean  : {boolean : {}},
    bigint   : {bigint  : {}},
    symbol   : {symbol  : {}},
    // @ts-ignore TODO!!!!
    get nullable(){ return isModificator(['nullable'])},
    // @ts-ignore TODO!!!!
    get optional(){ return isModificator(['optional'])},
    object   : <T>(descriptions:T)=>( {object:descriptions}),
    // @ts-ignore TODO!!!!
    get array(){ return isModificator(['array'])},
    /*
    union    : {string   : {}},
    */
    class    : (c:Constructor<any>) => ({class: c}),
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
                    for(var i=name.length-1; i>=0; i--){
                        value = {[name[i]]: value} as Description;
                    }
                    return value;
                }
            }
        }        
    });
    return proxy;
}
