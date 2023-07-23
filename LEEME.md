<!--multilang v0 es:LEEME.md en:README.md -->
# guarantee-type
<!--lang:es-->
Garantiza los tipos de las respuestas

<!--lang:en--]
guarantee the type of a plain object

[!--lang:*-->

<!-- cucardas -->
![extending](https://img.shields.io/badge/stability-extending-orange.svg)
[![npm-version](https://img.shields.io/npm/v/guarantee-type.svg)](https://npmjs.org/package/guarantee-type)
[![build](https://github.com/emilioplatzer/guarantee-type/actions/workflows/node.js.yml/badge.svg)](https://github.com/emilioplatzer/guarantee-type/actions/workflows/node.js.yml)
[![coverage](https://img.shields.io/coveralls/emilioplatzer/guarantee-type/master.svg)](https://coveralls.io/r/emilioplatzer/guarantee-type)
[![outdated-deps](https://img.shields.io/github/issues-search/emilioplatzer/guarantee-type?color=9cf&label=outdated-deps&query=is%3Apr%20author%3Aapp%2Fdependabot%20is%3Aopen)](https://github.com/emilioplatzer/guarantee-type/pulls/app%2Fdependabot)

<!--multilang buttons-->

idioma: ![castellano](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-es.png)
también disponible en:
[![inglés](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-en.png)](README.md)

<!--lang:es-->

# Objetivo

<!--lang:en--]

# Main goal

[!--lang:es-->

Cuando en [_Typescript_](typescriptlang.org) llegamos al momento de tener todos nuestros sistemas fuertemente tipados 
aparecen situaciones donde es difícil evitar el uso de `any`. 

Por ejemplo cuando levantamos datos de `LocalStorage`, los transferimos a través de la red 
o los levantamos de la base de datos y nuestro [`ORM`](https://es.wikipedia.org/wiki/Asignaci%C3%B3n_objeto-relacional)
no es fuertemente tipado en las respuestas, lo que obtenemos es un objeto `any`. 

<!--lang:en--]

When we use [_Typescript_](typescriptlang.org), in some point we want to use types everywere. 
But in some cases is very dificult to avoid the use of `any`. 

For example, when we get data from LocalStorage, we transfer data in the network 
or we retieve from the database and ower [`ORM`](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping)
is no typed enought. 

[!--lang:*-->

```ts
type Person = {
    name: string,
    age?: number,
    active: boolean, 
    due: Date
};

function print(person: Person){
    // ...
};

print(JSON.parse(localStorage['person1'])) // 💩 receiving any

// Using https://node-postgres.com/
const res = await client.query('SELECT $1::text as message', ['Hello world!'])
console.log(res.rows[0].messagggge)  // 💩 receiving undefined because the typo

```

<!--lang:es-->

Actualmente [_Typescript_](typescriptlang.org) no impide asignar `any` a un tipo determinado. 
Sería bueno tener una manera de que lo detecte, pero independientemente de eso 
necesitamos una manera de validar y setear los tipos de forma fuertemente tipada. 

<!--lang:en--]

Currently [_Typescript_](typescriptlang.org) do not avoid the use of `any` in the
right hand of an assignation. But regardless of that we need a way to validate 
and set types of received data. 


[!--lang:*-->

```ts
import { guarantee, is, GuaranteedType } from "guarantee-type";

var descriptionPerson = is.object({
    name: is.string,
    age: is.optional.number,
    active: is.boolean,
    due: is.class(Date)    // for Date class only you can write is.Date
});

type Person = GuaranteedType<typeof descriptionPerson>;

function print(person: Person){
    // ...
};

print(guarantee(descriptionPerson, JSON.parse(localStorage['person1']))); // 👍 ok, type guaranteed!

// Using https://node-postgres.com/
const res = await client.query('SELECT $1::text as message', ['Hello world!'])
console.log(guarantee( is.object({message: is.string}), res.rows[0]).messagggge)  // 👍 ok, typo detected!

```
<!--lang:es-->

# Profundizando

<!--lang:en--]

# Deep into

<!--lang:es-->

El mecanismo `is` para describir los tipos es una abreviación. 
Las descripciones se pueden escribir y transmitir en un objeto que puede
codificarse en formato `JSON`. Por ejemplo la descripción `descriptionPerson`
puede esciribirse directamente en un objetos simple:

<!--lang:en--]

Using `is` for describe the type is optional. 
The descriptions can be defined in a plain _Javascript_ object that
can be serializable and enceded with `JSON`. 
For example `descriptionPerson` can be writen like this:

[!--lang:*-->

```ts
var descriptionPerson = { 
    object: {
        name: { string: {} },
        age: { optional: { number: {} },
        active: { boolean: {} },
        due: { class: Date }
    }
};
```

<!--lang:es-->

## Licencia

<!--lang:en--]

## License

[!--lang:*-->

[MIT](LICENSE)
