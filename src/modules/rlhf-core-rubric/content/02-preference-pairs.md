# Preference Pairs & Ranking

RLHF datasets are often built from **preference pairs**: given the same prompt, which completion is better?

## Pair formats
- **A vs B** — binary preference
- **Likert / scalar** — score each response on a scale
- **Best-of-N** — pick the top response among several

## Rules of engagement
- Judge **only** from the provided prompt + responses.
- Do not invent missing context.
- If both responses fail critical safety/helpfulness bars, mark **both bad** rather than forcing a winner.
- Ties are allowed when differences are not material under the rubric.

## Justification standard
Your note should cite at least one rubric dimension (e.g. “B is more truthful; A hallucinates a citation”).
