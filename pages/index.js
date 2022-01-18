import { useCallback, useEffect, useReducer } from "react";

const nGuesses = 6;
const wordleLength = 5;

const keyCodes = {
  A: 65,
  Z: 90,
  Backspace: 8,
  Enter: 13,
};

const actionTypes = {
  TYPE_LETTER: "TYPE_LETTER",
  TYPE_BACKSPACE: "TYPE_BACKSPACE",
  ACCEPT_RESPONSE: "ACCEPT_RESPONSE",
  ACCEPT_ERROR: "ACCEPT_ERROR",
};

const initialState = {
  guess: "",
  guessError: null,
  history: [],
  outcome: null,
};

function reducer(state, action) {
  switch (action.type) {
    case actionTypes.TYPE_LETTER:
      return {
        ...state,
        guess: `${state.guess}${action.letter}`
          .slice(0, wordleLength)
          .toUpperCase(),
      };
    case actionTypes.TYPE_BACKSPACE:
      return {
        ...state,
        guess: state.guess.slice(0, state.guess.length - 1),
        guessError: null,
      };
    case actionTypes.ACCEPT_RESPONSE:
      return {
        ...state,
        history: state.history.concat({ letters: action.response.letters }),
        guess: initialState.guess,
        outcome: action.response.outcome,
      };
    case actionTypes.ACCEPT_ERROR:
      return {
        ...state,
        guessError: action.response.error,
      };
    default:
      throw new Error();
  }
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { guess, guessError, history, outcome } = state;

  const submitWordle = useCallback(async () => {
    if (guess.length !== wordleLength) return;

    const res = await fetch("/api/wordle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guess }),
    });
    const jsonResponse = await res.json();

    if (res.ok) {
      dispatch({ type: actionTypes.ACCEPT_RESPONSE, response: jsonResponse });
    } else if (jsonResponse && "error" in jsonResponse) {
      dispatch({ type: actionTypes.ACCEPT_ERROR, response: jsonResponse });
    } else {
      console.error("Error response", jsonResponse);
    }
  }, [guess]);

  useEffect(() => {
    if (outcome !== null) return;

    const onKeyUp = (e) => {
      if (e.keyCode >= keyCodes.A && e.keyCode <= keyCodes.Z) {
        dispatch({ type: actionTypes.TYPE_LETTER, letter: e.key });
      } else if (e.keyCode === keyCodes.Backspace) {
        dispatch({ type: actionTypes.TYPE_BACKSPACE });
      } else if (e.keyCode === keyCodes.Enter) {
        submitWordle()
          .then(() => {})
          .catch((error) => console.error(error));
      }
    };

    window.addEventListener("keyup", onKeyUp);

    return () => window.removeEventListener("keyup", onKeyUp);
  }, [outcome, submitWordle]);

  return (
    <div className="wordle-container">
      <Grid guess={guess} guessError={guessError} history={history} />
      {outcome === "win" && (
        <div style={{ color: "green", textAlign: "center", padding: "1rem" }}>
          You guessed the correct word in
          <br />
          <strong>
            {history.length} attempt{history.length !== 1 && "s"}
          </strong>
          !
        </div>
      )}
    </div>
  );
}

function Grid({ guess, guessError, history }) {
  let grid = [...history];

  let currentRow = {
    letters: new Array(wordleLength),
    error: guessError,
  };
  for (
    let letterIndex = 0;
    letterIndex < currentRow.letters.length;
    letterIndex++
  ) {
    currentRow.letters[letterIndex] = {
      value: guess.charAt(letterIndex),
      result: null,
    };
  }
  grid.push(currentRow);

  for (let i = grid.length; i < nGuesses; i++) {
    let blankRow = {
      letters: new Array(wordleLength),
    };

    for (let j = 0; j < blankRow.letters.length; j++) {
      blankRow.letters[j] = { value: null, result: null };
    }

    grid.push(blankRow);
  }

  return (
    <>
      {grid.map(({ letters, error }, index) => (
        <Guess key={index} letters={letters} error={error} />
      ))}
    </>
  );
}

function Guess({ letters, error }) {
  let classNames = ["wordle-guess"];
  if (error) classNames.push("wordle-guess--with-error");

  return (
    <div className={classNames.join(" ")}>
      {letters.map((letter, index) => {
        let letterClassNames = ["wordle-letter"];
        if (letter.result !== null) {
          letterClassNames.push(`wordle-letter--${letter.result}`);
        }

        return (
          <div key={index} className={letterClassNames.join(" ")}>
            <span>{letter.value}</span>
          </div>
        );
      })}
    </div>
  );
}
