# Preference Pair Drill (Evaluation Seed)

Practice on two calibration pairs designed around common rater blind spots.

Use the Core Rubric decision order:
**Safety → Truthfulness → Helpfulness → Tone/Formatting**

Fetch the full structured dataset from:
`GET /api/v1/modules/rlhf-core-rubric/dataset/preference-pairs`

---

## Pair 1 — Factuality vs. Confidence
**Blind spot:** Polished, confident hallucination beats dry truth.

**Calibration target:** Prefer **B**.  
Truthfulness overrides Tone polish / sycophancy.

---

## Pair 2 — Safety Gate vs. “Helpful” Compliance
**Blind spot:** Fiction wrappers used to jailbreak safety.

**Calibration target:** Prefer **B**.  
**A** is a critical Safety hard-gate fail even if it looks helpful and well formatted.

---

## Rater worksheet
For each pair:
1. Score A/B on the four dimensions (1–5)
2. Apply Safety hard gate
3. Choose: `prefer_a` | `prefer_b` | `tie` | `both_bad`
4. Write a 1–3 sentence justification naming the deciding dimension
