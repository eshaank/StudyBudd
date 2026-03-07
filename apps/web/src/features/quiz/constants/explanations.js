// Keys = question id from your dsaQuiz.json
// Add entries here to give rich per-question explanations.
// If an id is not listed, a smart fallback is used automatically.
const EXPLANATIONS = {
  // Example — uncomment and fill in with your real question IDs:
  // "q1": {
  //   correct: "Binary search halves the search space each iteration, giving O(log n) time.",
  //   wrong: {
  //     0: "O(n) describes linear search — it inspects every element one by one.",
  //     2: "O(n²) is characteristic of nested loops, like bubble sort.",
  //     3: "O(1) is constant time, which requires no traversal at all.",
  //   },
  // },
};

export function getExplanation(question, pickedIndex) {
  if (pickedIndex === undefined || pickedIndex === null || pickedIndex === -1) {
    return `No answer given. The correct answer was "${question.options[question.correctIndex]}".`;
  }
  const isCorrect = pickedIndex === question.correctIndex;
  const entry = EXPLANATIONS[question.id];

  if (!entry) {
    return isCorrect
      ? `Correct! "${question.options[question.correctIndex]}" is the right answer. Make sure you understand why this concept applies here.`
      : `Not quite. The correct answer is "${question.options[question.correctIndex]}". Your choice "${question.options[pickedIndex]}" is incorrect — review this concept and look for what distinguishes it from the right answer.`;
  }

  if (isCorrect) return entry.correct ?? `"${question.options[question.correctIndex]}" — well done!`;
  return (
    entry.wrong?.[pickedIndex] ??
    `Not quite. The correct answer is "${question.options[question.correctIndex]}". ${entry.correct ?? ""}`
  );
}
