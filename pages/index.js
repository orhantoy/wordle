import { useEffect, useState } from "react";

function Guess({ letters, error }) {
  let classNames = ["wordle-guess"];
  if (error) classNames.push("wordle-guess--with-error");

  return (
    <div className={classNames.join(" ")}>
      {letters.map((letter, index) => (
        <div
          key={index}
          className={`wordle-letter wordle-letter--${letter.result}`}
        >
          <span>{letter.value}</span>
        </div>
      ))}
    </div>
  );
}

const keyCodes = {
  A: 65,
  Z: 90,
  Backspace: 8,
  Enter: 13,
};

export default function Home() {
  const [guess, setGuesses] = useState("");
  const [guessError, setGuessError] = useState(null);
  const [history, setHistory] = useState([]);
  const [outcome, setOutcome] = useState(null);

  useEffect(() => {
    if (outcome !== null) return;

    const onKeyUp = async (e) => {
      if (e.keyCode >= keyCodes.A && e.keyCode <= keyCodes.Z) {
        setGuesses((prev) => `${prev}${e.key}`.slice(0, 5).toUpperCase());
      } else if (e.keyCode === keyCodes.Backspace) {
        setGuesses((prev) => prev.slice(0, prev.length - 1));
        setGuessError(null);
      } else if (e.keyCode === keyCodes.Enter && guess.length === 5) {
        const res = await fetch("/api/wordle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guess }),
        });
        const jsonResponse = await res.json();

        if (res.ok) {
          setHistory((prev) => prev.concat([jsonResponse.result]));
          setGuesses("");
          setOutcome(jsonResponse.outcome);
          return;
        }

        if (jsonResponse && "error" in jsonResponse) {
          setGuessError(jsonResponse.error);
        } else {
          console.error("Error response", jsonResponse);
          setGuessError("Something unexpected happened");
        }
      }
    };

    window.addEventListener("keyup", onKeyUp);

    return () => window.removeEventListener("keyup", onKeyUp);
  }, [guess, outcome]);

  let grid = [...history];
  let currentRow = new Array(5);
  for (let letterIndex = 0; letterIndex < currentRow.length; letterIndex++) {
    currentRow[letterIndex] = {
      value: guess.charAt(letterIndex),
      result: "unknown",
    };
  }
  grid.push(currentRow);

  for (let i = grid.length; i < 6; i++) {
    let blankRow = new Array(5);

    for (let j = 0; j < blankRow.length; j++) {
      blankRow[j] = { value: null, result: "unknown" };
    }

    grid.push(blankRow);
  }

  return (
    <div className="wordle-container">
      {grid.map((letters, index) => (
        <Guess
          key={index}
          letters={letters}
          error={history.length === index ? guessError : null}
        />
      ))}
      {outcome === "win" && (
        <div style={{ color: "green", textAlign: "center", padding: "1rem" }}>
          You guessed the correct word after<br />
          <strong>{history.length} attempt{history.length !== 1 && "s"}</strong>!
        </div>
      )}
    </div>
  );
}
