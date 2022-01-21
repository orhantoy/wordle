import { readFileSync } from "fs";
import path from "path";
import seedrandom from "seedrandom";

const wordFilePath =
  process.env["NODE_ENV"] === "development"
    ? "/usr/share/dict/words"
    : path.join(__dirname, "_files", "dict-words.txt");
const wordleLength = 5;
let dictionary;

try {
  const fileData = readFileSync(wordFilePath, "utf8");
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

function guessComparison(guess, correctWord) {
  if (guess.length !== correctWord.length) {
    throw "guess and correctWord must be of equal length";
  }

  let letters = new Array(wordleLength);
  let remainingLetters = correctWord.split("");

  // First we determine correctly positioned letters
  for (let i = 0; i < letters.length; i++) {
    const guessedLetter = guess.charAt(i);
    let result = null;

    if (correctWord.charAt(i) === guessedLetter) {
      result = resultTypes.CorrectPosition;
      remainingLetters[i] = null;
    }

    letters[i] = {
      value: guessedLetter,
      result,
    };
  }

  // And then we consider letters that exist in the word, handling duplicates.
  for (let i = 0; i < letters.length; i++) {
    if (letters[i].result !== null) {
      continue;
    }

    const guessedLetter = guess.charAt(i);
    const index = remainingLetters.indexOf(guessedLetter);
    if (index !== -1) {
      letters[i].result = resultTypes.InWord;
      remainingLetters[index] = null;
    } else {
      letters[i].result = resultTypes.NotInWord;
    }
  }

  return letters;
}

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

    res.status(200).json({
      letters: guessComparison(guess, wordle),
      outcome: guess == wordle ? "win" : null,
    });
    return;
  }

  res.status(404).end();
}
