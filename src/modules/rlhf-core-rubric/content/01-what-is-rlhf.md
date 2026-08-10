# What is RLHF?

**Reinforcement Learning from Human Feedback (RLHF)** is the process of aligning model behavior with human preferences by training on ranked or scored human judgments.

## Why it matters
- Raw next-token prediction does not encode safety, helpfulness, or product taste.
- Human raters supply the preference signal that shapes reward models.
- A consistent rubric turns subjective taste into measurable training data.

## The VettedME rater loop
1. Read the prompt and candidate responses.
2. Apply the **Core Rubric** dimensions.
3. Choose a preference (or mark a tie / invalid).
4. Leave a short justification tied to rubric criteria.

## Learning objective
By the end of this module you can explain RLHF in one paragraph and name the **four** Core Rubric dimensions used in Module 1:
Helpfulness & Directness, Truthfulness & Factuality, Harm Mitigation & Safety, and Tone & Formatting.
