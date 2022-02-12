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
