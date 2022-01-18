// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

const fs = require("fs");
const seedrandom = require("seedrandom");

const wordFilePath = "/usr/share/dict/words";
let dictionary

try {
  const fileData = fs.readFileSync(wordFilePath, "utf8");
  dictionary = fileData.toString().toUpperCase().split("\n");
} catch (err) {
  console.error(err);
}

async function getWordle() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  const seed = date.toUTCString();
  const rng = seedrandom(seed);
  const randomDictionaryIndex = Math.round(rng() * dictionary.length);

  let randomWord = null
  for (let i = randomDictionaryIndex; randomWord === null; i++) {
    if (dictionary[i].length === 5) {
      randomWord = dictionary[i];
    }
  }

  return {
    seed: seed,
    wordle: randomWord,
  };
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { wordle } = await getWordle();
    const { guess } = req.body;

    if (!guess || typeof guess !== "string") {
      res.status(400).json({ error: "Guess (string) must be provided" });
      return;
    }

    if (guess.length !== 5) {
      res.status(400).json({ error: "Guess must consist of 5 characters" });
      return;
    }

    if (!dictionary.includes(guess)) {
      res.status(400).json({ error: "Guess does not exist in dictionary" });
      return;
    }

    let result = new Array(5);
    for (let i = 0; i < result.length; i++) {
      const letter = wordle.charAt(i);
      const guessedLetter = guess.charAt(i);

      if (letter === guessedLetter) {
        result[i] = {
          result: "correct",
        };
      } else if (wordle.includes(guessedLetter)) {
        result[i] = {
          result: "in-word",
        };
      } else {
        result[i] = {
          result: "not-in-word",
        };
      }

      result[i].value = guessedLetter;
    }

    const outcome = wordle === guess ? "win" : null;

    res.status(200).json({ result, outcome });
  }

  res.status(404).end();
}
