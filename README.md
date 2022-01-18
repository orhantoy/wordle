# Wordle clone built with React

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

## Improvements

- You're currently not limited to 6 guesses
  - If this is resolved, present user with the correct word at the end
- Improve scenario where a guess contains duplicate letters
  - Or just disallow words with duplicate letters to avoid situation entirely
- Parameterize length of word and number of guesses
- Hard mode (do not show in-word but only if correct position)
- Better dictionary

## Credits

https://www.powerlanguage.co.uk/wordle/

---

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
