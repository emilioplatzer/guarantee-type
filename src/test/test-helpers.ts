import { jsonParse, /*is,*/ nullOpts, DefinedType} from "../lib/guarantee-type";

import * as assert from "assert";

describe("helpers", function(){
    describe("jsonParse", function(){
        it("simple plain object", function(){
            var expectedObject = {
                one: "The One",
                two: 2
            }
            var jsonString = JSON.stringify(expectedObject);
            // var description = is.object({ one: is.string, two: is.number })
            var description = {object: { one: {string:{}}, two: {number:{} } }}
            var obtainedObject = jsonParse(description, jsonString);
            var checkType: typeof expectedObject = obtainedObject;
            assert.deepStrictEqual(checkType, expectedObject);
        });
    });
})
