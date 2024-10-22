const { printName, printAge, printHello, printMax } = require("./sum");

// Testing PrintName
test("Testing Print Name Function", () => {
  const spy = jest.spyOn(console, "log");
  const names = ["Aya", "Moudhi", "Abullah", "Ali"];

  names.forEach((name) => {
    printName(name);
    expect(spy).toHaveBeenCalledWith(name);
  });

  spy.mockRestore();
});

// Testing Print Age Function - Input is valid year of birth
test("Testing Print Age", () => {
  const spy = jest.spyOn(console, "log");
  const yearOfBirths = [1996, 1998, 2000, 2002, 2004];

  yearOfBirths.forEach((YOB) => {
    printAge(YOB);
    expect(spy).toHaveBeenCalledWith(2024 - YOB);
  });
});

// Testing Print Hello Function - Input is valid name and language
test("Testing Print Hello Function", () => {
  const spy = jest.spyOn(console, "log");
  const names = ["Aya", "Moudhi", "Abullah", "Ali"];
  const languages = ["en", "es", "fr", "tr"];
  const greetings = ["Hello", "Hola", "Bonjour", "Merhaba"];

  names.forEach((name) => {
    languages.forEach((language, index) => {
      printHello(name, language);
      expect(spy).toHaveBeenCalledWith(`${greetings[index]} ${name}`);
    });
  });

  spy.mockRestore();
});

// Testing Print Max Function - Input is valid numbers

test("Testing Print Max Function", () => {
  const spy = jest.spyOn(console, "log");
  const numbers = [
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
    [9, 10],
  ];

  numbers.forEach((nums) => {
    printMax(nums[0], nums[1]);
    expect(spy).toHaveBeenCalledWith(Math.max(...nums));
  });

  spy.mockRestore();
});
