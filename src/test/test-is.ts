import { Description, Opts, guarantee, guaranteeOnError, throwAllErrorsInAString, consoleErrorAllErrors, ignoreAllErrors,
    is, nullOpts, DefinedType
} from "../lib/guarantee-type";

import * as assert from "assert";

var opts:Opts;

class ExampleForTest{}

describe("internal representation of is", function(){
    it("boolean", function(){
        assert.deepEqual(is.boolean, {boolean: nullOpts})
    })
    it("nullable", function(){
        assert.deepEqual(is.nullable.string, {nullable:{string: nullOpts}})
    })
    it("optional", function(){
        assert.deepEqual(is.optional.number, {optional:{number: nullOpts}})
    })
    it("class", function(){
        assert.deepEqual(is.class(ExampleForTest), {class:ExampleForTest})
    })
    it("Date", function(){
        assert.deepEqual(is.Date, {class:Date})
    })
    it("object", function(){
        assert.deepEqual(is.object({
            name:is.string,
            age:is.optional.number,
            born:is.Date
        }), {object:{
            name:{string: nullOpts},
            age:{optional:{number: nullOpts}},
            born:{class:Date}
        }})
    })
    it("string[]", function(){
        assert.deepEqual(is.array.string, {array:{string: nullOpts}});
    })
    it("(bigint|null)[]", function(){
        assert.deepEqual(is.array.nullable.bigint, {array:{nullable:{bigint: nullOpts}}});
        var x: DefinedType<typeof is.array.nullable.bigint> = [];
        var y: (bigint|null)[] = [];
        // @ts-expect-error x is not any
        var n:null = x;
        x=y;
        y=x; 
    })
    it("string[]|null", function(){
        assert.deepEqual(is.nullable.array.string, {nullable:{array:{string: nullOpts}}});
        var x:DefinedType<typeof is.nullable.array.string>
        var y: string[]|null = [];
        // @ts-expect-error x is not any
        var n:null = x;
        x=y;
        y=x; 
    })
    it("optional object", function(){
        var description = is.optional.object({name:is.string});
        assert.deepEqual(description, {optional:{object:{name: {string:nullOpts}}}})
        var resultNull = guarantee(description, null)
        assert.deepEqual(resultNull, null);
        var resultOk = guarantee(description, {name:'the name'});
        assert.deepEqual(resultOk, {name:'the name'});
    })
    it("{}[]", function(){
        var description = is.array.object({name:is.string});
        assert.deepEqual(description, {array:{object:{name: {string:nullOpts}}}})
        var resultOk = guarantee(description, [{name:'the name'}, {name:'name'}]);
        assert.deepEqual(resultOk, [{name:'the name'}, {name:'name'}]);
    })
})

describe("guarantee",function(){
    describe("values",function(){
        it("string", function(){
            var result:string; 
            var value:any = "any string";
            result = guarantee(is.string, value);
            assert.equal(result, value);
        })
        it("detects TypeError string cannot be asigned to number", function(){
            var resultN:number = 0; 
            var value:any = "any string";
            // @ts-expect-error
            resultN = guarantee(is.string, value);
            // This is JS, guarantee don't throws if the result variable is of different type
            assert.strictEqual(resultN, "any string");
            // @ts-expect-error
            var resultS:string = guarantee({number:opts}, 42);
            // This is JS, guarantee don't throws if the result variable is of different type
            assert.strictEqual(resultS, 42);
            assert.notStrictEqual(resultS, "42");
        })
        it("number cannot be assigned to string", function(){
            var value:any = 43;
            assert.throws(()=>guarantee(is.string, undefined), /guarantee excpetion. Value is undefined but type is not nullable/);
        })
        it("can set a optional variable", function(){
            var value:any = null;
            var result:boolean|null|undefined = guarantee(is.optional.boolean, value);
            var optional = guarantee(is.optional.boolean, value);
            optional = result;
            assert.strictEqual(optional, value)
        })
    });
    describe("objects like Record<string, value>", function(){
        var description1 = {object: {
            name: { string : opts },
            age:  { number : opts },
            ready:{ boolean: opts },
        }}
        var description1is = is.object({
            name: is.string ,
            age:  is.number ,
            ready:is.boolean,
        })
        type Type1 = {
            name: string
            age: number
            ready: boolean
        }
        var value1 = {
            name: 'Abigail',
            age: 72,
            ready: true,
        }
        type Type2 = {
            name: string
            born: Date
        }
        it("detects TypeError", function(){
            var result: Type2
            // @ts-expect-error
            result = guarantee(description1, value1);
            // @ts-expect-error
            result = guarantee(description1is, value1);
            // This is JS, guarantee don't throws if the result variable is of different type
            assert.deepStrictEqual(result, value1);
        })
        it("receive a good object", function(){
            var result: Type1
            result = guarantee(description1, value1 );
            assert.equal(result, value1);
            var result2 = guarantee(description1is, value1 );
            assert.equal(result2, value1);
            // @ts-expect-error Esto está puesto para evitar que result2 sea null y esto lo detectaría al permitir asignar cualquier cosa.
            result2 = {name:1, age:1, ready:1}
        })
    })
    describe("array", function(){
        it("accept array", function(){
            var description = {array:{boolean:opts}};
            var result:boolean[] = guarantee(description, [true, false]);
            var autoResult = guarantee(is.array.boolean, [true, false]); // to ensure not 'any'
            // @ts-expect-error
            var wrongResult:string[] = autoResult // if the previous return 'any' this don't detect the error
            var autoResult2 = guarantee(is.array.optional.boolean, [true, false]); // to ensure not 'any'
            var rightResult2:(boolean|undefined|null)[] = autoResult2
            // @ts-expect-error
            var wrongResult2:boolean[] = autoResult2 // if the previous return 'any' this don't detect the error
        })
    })
    describe("recordString", function(){
        it("accept recordString", function(){
            var description = {recordString:{boolean:opts}};
            var result:Record<string, boolean> = guarantee(description, {yes:true, no:false});
            var autoResult = guarantee(is.recordString.boolean, {yes:true, no:false}); // to ensure not 'any'
            // @ts-expect-error
            var wrongResult:Record<string, string> = autoResult // if the previous return 'any' this don't detect the error
            var autoResult2 = guarantee(is.recordString.optional.boolean, {yes:true, no:false}); // to ensure not 'any'
            var rightResult2:Record<string, (boolean|undefined|null)> = autoResult2
            // @ts-expect-error
            var wrongResult2:Record<string, boolean> = autoResult2 // if the previous return 'any' this don't detect the error
        })
    })
    describe("union", function(){
        it("accepts any type with the last value", function(){
            var result: string|number|{}|boolean;
            var any:any = true;
            result = guarantee(is.union([is.string,is.number,is.object({}),is.boolean]), any);
            assert.strictEqual(result, any);
        })
    })
    describe("literal", function(){
        it("accept literal in union", function(){
            var result: "one"|"two";
            var any:any = "one";
            result = guarantee(is.union([is.literal("one" as "one"), is.literal("two" as "two")]), any);
            assert.strictEqual(result, any);
        })
    })
    describe("class values", function(){
        it("receives is.Date", function(){
            var description = is.Date;
            var result:Date;
            var value = new Date(1969,5,6)
            result = guarantee(description, value);
            assert.strictEqual(result, value)
        })
        it("works with dates in an object", function(){
            var description = is.object({
                name: is.string,
                birthdate: is.Date,
                age: is.number
            });
            var result: {name:string, birthdate: Date, age: number};
            function nullObject<T extends Description>(description:T):DefinedType<T>{
                // @ts-expect-error this is a naive implementation. 
                var result: DefinedType<T> = {}
                for (var key in description) {
                    result[key] = null;
                }
                return result;
            }
            var obtained = nullObject(description);
            // @ts-expect-error It expects that birthdate is not any
            var no_number:number = obtained.birthdate;
            result = obtained;
        })
    })
})
