import { Description, Opts, guarantee, guaranteeOnError, throwAllErrorsInAString, consoleErrorAllErrors, ignoreAllErrors } from "../lib/guarantee-type";

import * as assert from "assert";

var opts:Opts;

describe("guarantee",function(){
    describe("values",function(){
        it("string", function(){
            var result:string; 
            var value:any = "any string";
            result = guarantee({string:opts}, value);
            assert.equal(result, value);
        })
        it("detects TypeError string cannot be asigned to number", function(){
            var result:number; 
            var value:any = "any string";
            // @ts-expect-error
            result = guarantee({string:opts}, value);
            // @ts-expect-error
            var results:string = guarantee({number:opts}, 42);
        })
        it("number cannot be assigned to string", function(){
            var value:any = 43;
            assert.throws(()=>guarantee({string:opts}, value), /guarantee excpetion. Value is not "string"/);
            assert.throws(()=>guarantee({string:opts}, undefined), /guarantee excpetion. Value is undefined but type is not nullable/);
        })
        it("can set a optional variable", function(){
            var value:any = null;
            var result:boolean|null|undefined = guarantee({optional:{boolean:opts}}, value);
            assert.equal(result, value)
        })
        it("detects TypeError can set a optional variable", function(){
            var value:any = true;
            // @ts-expect-error
            var result:boolean|null = guarantee({optional:{boolean:opts}}, value);
        })
        it("can set a nullable variable", function(){
            var value:any = null;
            var result:boolean|null = guarantee({nullable:{boolean:opts}}, value);
            assert.equal(result, value)
        })
        it("detects TypeError can set a nullable variable", function(){
            var value:any = true;
            // @ts-expect-error
            var result:boolean = guarantee({nullable:{boolean:opts}}, value);
        })
        it("invalid type in description", function(){
            var value:any = 8.8;
            var badDescription = {float8:opts} as unknown as Description // Bad description
            assert.throws(function(){
                // @ts-expect-error Type instantiation is excessively deep and possibly infinite.ts(2589)
                guarantee(badDescription, value)
            }, /float8 is not a valid type/);
        })
    });
    describe("objects like Record<string, value>", function(){
        var description1 = {object: {
            name: { string : opts },
            age:  { number : opts },
            ready:{ boolean: opts },
        }}
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
        })
        it("receive a good object", function(){
            var result: Type1
            result = guarantee(description1, value1 );
            assert.equal(result, value1);
        })
        it("rejects a bad object", function(){
            var value = {
                name: "Pedro",
                age: "43",
                ready: "yes"
            }
            assert.throws(()=>guarantee(description1, value ), /guarantee excpetion. Value\.age is not "number".* Value\.ready is not "boolean"/);
        })
        it("rejects a bad object", function(){
            var value = {
                name: "Pedro",
                age: null,
                ready: null
            }
            assert.throws(()=>guarantee(description1, value ), /guarantee excpetion. Value\.age is null but type is not nullable/);
        })
    })
    describe("object with more than one level", function(){
        it("rejects deeply", function(){
            var description = {object:{alpha:{object:{betha:{string:opts}}}}}
            assert.throws(()=>guarantee(description, {alpha:{betha:false}} ), /guarantee excpetion. Value\.alpha\.betha is not "string"/);
        })
        it("accepts complex object", function(){
            var description = {object:{alpha:{object:{betha:{string:opts},gamma:{number:opts}}}}}
            var value = {alpha:{betha:'x', gamma:1}}
            var result:{alpha:{betha:string, gamma:number}} = guarantee(description, value);
            assert.deepStrictEqual(result, value);
        })
    })
    describe("array", function(){
        it("accept array", function(){
            var description = {array:{boolean:opts}};
            var result:boolean[] = guarantee(description, [true, false]);
        })
        it("rejects non array", function(){
            var description = {array:{boolean:opts}};
            assert.throws(()=>guarantee(description, true), /guarantee excpetion. Value is not an array and must be/);
        })
        it("rejects wrong element", function(){
            var description = {array:{boolean:opts}};
            assert.throws(()=>guarantee(description, [true,'one']), /guarantee excpetion. Value\[1\] is not "boolean"/);
        })
        it("rejects wrong element in an object with array", function(){
            var description = {object:{omega:{array:{boolean:opts}}}};
            assert.throws(()=>guarantee(description, {omega:[[]]}), /guarantee excpetion. Value\.omega\[0\] is not "boolean"/);
        })
        it("rejects non array in object", function(){
            var description = {object:{omega:{array:{boolean:opts}}}};
            assert.throws(()=>guarantee(description, {omega:false}), /guarantee excpetion. Value\.omega is not an array and must be/);
        })
    })
    describe("union", function(){
        it("accepts any type", function(){
            var result: string|number;
            var any:any = 42;
            result = guarantee({union:{1:{string:opts},2:{number:opts}}}, any);
            assert.equal(result, any);
        })
        it("reject wrong type", function(){
            var any:any = false;
            assert.throws(()=>guarantee({union:{1:{string:opts},2:{number:opts}}}, any),/guarantee excpetion. Value\(in union\) is not "string", Value\(in union\) is not "number"/);
        })
    })
    describe("configurable on error", function(){
        afterEach(function(){
            guaranteeOnError(throwAllErrorsInAString);
        })
        it("can use any error", function(){
            var description = {union:{1:{string:opts},2:{object:{x:{number:opts}}}}}
            var viewed:string[] = ["x"];
            function anyError(errors:string[]){
                viewed = errors;
            }
            var any:any = false;
            guaranteeOnError(anyError)
            var result:string|{x:number} = guarantee(description, any);
            assert.deepStrictEqual(viewed, [
                "Value(in union) is not \"string\"",
                "Value(in union).x is undefined but type is not nullable"
            ])
        })
        it("can log error", function(){
            guaranteeOnError(consoleErrorAllErrors)
            guarantee({boolean:opts}, 1);
            guarantee({boolean:opts}, false);
        })
        it("can ignore error", function(){
            guaranteeOnError(ignoreAllErrors)
            guarantee({boolean:opts}, 1);
        })
    })
    describe("class values", function(){
        it("receives Date", function(){
            var description = {class: Date};
            var result:Date;
            var value = new Date(1969,5,6)
            result = guarantee(description, value);
            assert.equal(result, value)
        })
        it("rejects non Date", function(){
            var description = {class: Date};
            var result:Date;
            var value = 52;
            assert.throws(()=>{
                result = guarantee(description, value);
            },/guarantee excpetion. Value is not "Date"/)
        })
        it("detects invalid class", function(){
            var description = {object:{due:{class: Date}, pattern:{class:RegExp}, other:{class:RegExp}}};
            var result:{due:Date, pattern:RegExp, other:Date} = {due:new Date(), pattern:/not/, other:new Date()}
            var value = {due:new Date(), pattern:/mm-dd-yyyy/, other:new Date()};
            assert.throws(()=>{
                // @ts-expect-error INVALID CLASS
                result = guarantee(description, value);
            },/guarantee excpetion. Value.other is not "RegExp"/);
            assert.notDeepEqual(value, result);
        })
    })
})
