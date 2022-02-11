import { Description, Opts, guarantee } from "../lib/guarantee-type";

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
            assert.throws(()=>guarantee({string:opts}, value), /guarantee excpetion. Value is not proper type/);
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
            assert.throws(()=>guarantee(description1, value ), /guarantee excpetion. age is not proper type/);
        })
        it("rejects a bad object", function(){
            var value = {
                name: "Pedro",
                age: null,
                ready: null
            }
            assert.throws(()=>guarantee(description1, value ), /guarantee excpetion. age is null but type is not nullable/);
        })
    })
    describe("object with more than one level", function(){
        it("rejects deeply", function(){
            var description = {object:{alpha:{object:{betha:{string:opts}}}}}
            assert.throws(()=>guarantee(description, {alpha:{betha:false}} ), /guarantee excpetion. alpha,betha is not proper type/);
        })
    })
})
