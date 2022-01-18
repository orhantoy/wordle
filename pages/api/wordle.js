// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

const fs = require("fs");
const seedrandom = require("seedrandom");

const wordFilePath = "/usr/share/dict/words";
const wordleLength = 5;
let dictionary;

try {
  const fileData = fs.readFileSync(wordFilePath, "utf8");
  dictionary = fileData.toString().toUpperCase().split("\n");
} catch (err) {
  console.error(err);
}

let wordCache = new Map();

async function getWordle() {
  // Generate seed from current time, with the minutes, seconds and milliseconds set to 0.
  const date = new Date();
  date.setMinutes(0, 0, 0);
  const seed = date.toUTCString();

  if (!wordCache.has(seed)) {
    const rng = seedrandom(seed);
    const randomDictionaryIndex = Math.round(rng() * dictionary.length);

    let randomWord = null;
    for (
      let i = randomDictionaryIndex;
      randomWord === null;
      i = (i + 1) % dictionary.length
    ) {
      if (dictionary[i].length === wordleLength) {
        randomWord = dictionary[i];
      }
    }

    wordCache.set(seed, randomWord);
  }

  console.log({ seed: seed, word: wordCache.get(seed) });
  return wordCache.get(seed);
}

const resultTypes = {
  CorrectPosition: "correct",
  InWord: "in-word",
  NotInWord: "not-in-word",
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const wordle = await getWordle();
    const { guess } = req.body;

    if (!guess || typeof guess !== "string") {
      res.status(400).json({ error: "Guess (string) must be provided" });
      return;
    }

    if (guess.length !== wordleLength) {
      res.status(400).json({ error: "Guess must consist of 5 characters" });
      return;
    }

    if (!dictionary.includes(guess)) {
      res.status(400).json({ error: "Guess does not exist in dictionary" });
      return;
    }

    let letters = new Array(wordleLength);
    for (let i = 0; i < letters.length; i++) {
      const guessedLetter = guess.charAt(i);
      let result;

      if (wordle.charAt(i) === guessedLetter) {
        result = resultTypes.CorrectPosition;
      } else if (wordle.includes(guessedLetter)) {
        result = resultTypes.InWord;
      } else {
        result = resultTypes.NotInWord;
      }

      letters[i] = {
        value: guessedLetter,
        result,
      };
    }

    const outcome = wordle === guess ? "win" : null;

    res.status(200).json({ letters, outcome });
    return;
  }

  res.status(404).end();
}
