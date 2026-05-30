import { Description, Constructor, DefinedType, is, guarantee } from "../lib/guarantee-type";
import * as assert from "assert";

// Reproduce el escenario que rompía a un consumidor (serial-tester + type-fest):
// un genérico que aplica un mapped type recursivo profundo sobre DefinedType<T>,
// con T inferido en el call site (NoInfer). Con descriptions grandes esto
// disparaba TS2589 "Type instantiation is excessively deep and possibly infinite".
//
// El emulador no depende de ningún paquete: imita PartialOnUndefinedDeep de
// type-fest (vuelve opcionales las claves cuyo tipo acepta undefined).

type BuiltIn = Date | RegExp | Function | bigint | symbol
type DeepPartialOnUndefined<T> =
    T extends BuiltIn ? T :
    T extends object ? (
        { [K in keyof T as undefined extends T[K] ? K : never]?: DeepPartialOnUndefined<T[K]> } &
        { [K in keyof T as undefined extends T[K] ? never : K]:  DeepPartialOnUndefined<T[K]> }
    ) : T

// Imita la firma de callProcedure de serial-tester. La implementación es mínima:
// valida los params contra parameters y devuelve el valor garantizado contra result.
function callProcedure<T extends Description, U extends Description>(
    target: { parameters: T, result: U },
    params: DeepPartialOnUndefined<DefinedType<NoInfer<T>>>
): DefinedType<NoInfer<U>>{
    guarantee(target.parameters, params)
    return guarantee(target.result, params)
}

describe("deep instantiation (no infinite types)", function(){
    it("a plain description with many fields does not explode", function(){
        // Description PLANA (sin el azúcar `is`): la deducción debe salir de acá.
        const registrar = {
            parameters: {
                object: {
                    idper:        { string: {} },
                    desde:        { class: Date as Constructor<Date> },
                    hasta:        { class: Date as Constructor<Date> },
                    annio:        { optional: { number: {} } },
                    cod_nov:      { nullable: { string: {} } },
                    cancela:      { nullable: { boolean: {} } },
                    dds0:         { nullable: { boolean: {} } },
                    dds1:         { nullable: { boolean: {} } },
                    dds2:         { nullable: { boolean: {} } },
                    dds3:         { nullable: { boolean: {} } },
                    dds4:         { nullable: { boolean: {} } },
                    dds5:         { nullable: { boolean: {} } },
                    dds6:         { nullable: { boolean: {} } },
                    detalles:     { nullable: { string: {} } },
                    fecha:        { nullable: { class: Date as Constructor<Date> } },
                    usuario:      { nullable: { string: {} } },
                    tipo_novedad: { nullable: { string: {} } },
                }
            },
            result: { object: { idper: { string: {} } } },
        } satisfies { parameters: Description, result: Description }

        var result = callProcedure(registrar, {
            idper: 'x',
            desde: new Date(),
            hasta: new Date(),
            cod_nov: null,
            cancela: null,
            dds0: null, dds1: null, dds2: null, dds3: null, dds4: null, dds5: null, dds6: null,
            detalles: null,
            fecha: null,
            usuario: null,
            tipo_novedad: null,
        });
        // el resultado se deduce y no es `any`
        var idper: string = result.idper;
        // @ts-expect-error idper es string, no number (probaría que no es `any`)
        var notNumber: number = result.idper;
        assert.ok(idper === idper && notNumber === notNumber);
    })
    it("the same via the `is` sugar syntax", function(){
        const registrar = {
            parameters: is.object({
                idper:        is.string,
                desde:        is.Date,
                hasta:        is.Date,
                annio:        is.optional.number,
                cod_nov:      is.nullable.string,
                cancela:      is.nullable.boolean,
                detalles:     is.nullable.string,
                fecha:        is.nullable.Date,
                tipo_novedad: is.nullable.string,
            }),
            result: is.object({ idper: is.string }),
        }
        var result = callProcedure(registrar, {
            idper: 'x', desde: new Date(), hasta: new Date(),
            cod_nov: null, cancela: null, detalles: null, fecha: null, tipo_novedad: null,
        });
        var idper: string = result.idper;
        // @ts-expect-error idper es string, no number
        var notNumber: number = result.idper;
        assert.ok(idper === idper && notNumber === notNumber);
    })
})
