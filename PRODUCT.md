# Mathate

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
React frontend, Node.js / Express backend, Firebase Authentication and Firestore. Gemini for AI. User supplied this stack and the Mathate Firebase project configuration.

## Users
Children aged 6–11, prioritizing primary-school mathematics. Confirmed by the user on 24 November 2026. Administrators manage the topic catalog.

## Product Purpose
A mathematics ecosystem organized around topics instead of school grades. Children select a topic and easy, medium or hard difficulty, receive a generated problem, and solve it through a supportive conversation.

## Capabilities and Constraints
Reuse Math-AI's practice and tutor prompts, hint interaction and Vietnamese male/female Cloud TTS. The user requested a companion matching Mimo; the practice avatar now uses the same Mimo image with stateful motion. Original robot model is retained as an asset. Server-controlled XP, levels, topic administration, authentication, and history. School classes, exams and teacher reporting are outside this initial project.

## Brand Commitments
Name: Mathate. Cute, welcoming, friendly to children; mascots. Vietnamese UI. The user requested Impeccable and UI/UX design; Impeccable is the available skill covering both.

## Product Principles
- Encourage thinking instead of giving answers immediately.
- No public comparisons, loss of points for mistakes, or time pressure.
- Save progress consistently, and make AI failures recoverable.
- Make practice mode explicit; never represent scripted replies as live AI.

## Evidence on Hand
Math-AI source at `../Math-AI`. Eight practice/chat services are retained under `server/legacy`. Original Spline robot model is in `public/models/scene.splinecode`.

## Open Decisions
XP thresholds and reward formula are implementation defaults for review. Parent consent, content-review operations and production hosting require product decisions before a public children's launch. No analytics collection is enabled by default.
