# Classroom documentation review

Reviewed 24 November 2026 against current source. This is an ordinary extension of the existing Mathate system, with no replacement visual world, new illustration family or approved durable token change.

## System summary

1. Palette: existing leaf identity and user-selected sky, violet, rose and peach themes; classroom tint/border aliases consume the shared brand tokens.
2. Type: locally hosted Nunito; classroom headings use 30/21/18 px, with a 29 px welcome heading and smaller supplementary metadata. Existing responsive rules adjust the composition and welcome size.
3. Surfaces: white work areas, thin borders and rounded containers; desktop overview/class columns collapse through existing responsive breakpoints.
4. Components: existing buttons, Lucide icons, semantic class/topic lists, selected mascot artwork and labeled form controls extend the incumbent interface.
5. Existing rules retained: shared theme tokens for interface states, visible focus, accessible labels and reduced-motion behavior; no new named design rule was introduced.

## Evidence checked

- Product/system context: `PRODUCT.md`, `DESIGN.md`, `.impeccable/surfaces/classrooms.md`, and the Impeccable document/documenter references.
- UI source: `src/pages/TeacherOverview.jsx`, `src/pages/Teacher.jsx`, `src/components/TeacherClassGuide.jsx`, `src/pages/TeacherActivity.jsx`, `src/main.jsx`, `src/classrooms.css`; sampled existing `src/styles.css`, `src/readability.css` and `src/personalization.css`.
- Role/authentication source: `shared/roles.js`, `server/services/accounts.js`, `server/routes/classrooms.js`, `src/context/AppContext.jsx`, and role/login references in `src/pages/Accounts.jsx` and `src/pages/Login.jsx`.
- Flow/rules: `shared/classrooms.js`, `server/services/classrooms.js`, warmup schema/prompt references in `server/services/warmup-ai.js`, application checks in `server/app.js`, and `server/services/worksheet-pdf.js`.
- Documentation/assets: `docs/CLASSROOMS.md`, `server/assets/README.md`, static Nunito font files and accompanying OFL license.

## Documentation consistency

No material factual inconsistency was found in `docs/CLASSROOMS.md`; it remains unchanged.

- The overview derives counts, preparation tasks and upcoming deadlines from class/activity data. Empty class views provide topic suggestions, a roster invitation and a copyable invitation. The current welcome wording is “Giao nhiệm vụ”, “Hiểu từng nhóm”, “Luyện tập thêm tại lớp”. Removed process/readiness UI is not described as shipped behavior or restored by this review.
- Teacher is an Auth custom claim (`role: "teacher"`), with `admin: true` taking precedence. Account administration prevents editing protected roles; classroom APIs reread current claims. The client refreshes claims at sign-in and window focus. Teacher login/home routes lead to `/teacher`; class and topic routes match the documentation.
- Warmup duration is 420 seconds with eight questions and one stored attempt per member/topic. The server limits the attempt by the earlier assignment deadline, preserves saved answers and finalizes expired attempts. Published questions cannot be edited. Application creation and continuation are checked by the backend.
- Grouping uses submitted/finalized attempts, descending score, then join order and UID. Groups have at most five members; average scores at least 8 use hard, at least 5 use medium, otherwise easy. Personal application uses the same thresholds, defaulting to easy without a result.
- Each completed group receives two exercises. Teacher-only PDF data includes every member's full name and space for working, while the PDF template omits scores/ranks. Group generation/rebuild behavior and resumable failures match the operational guide.
- New PDF assets are static Nunito 500/800 TTF instances, with OFL/license and source/derivation documented in `server/assets/README.md`. App illustrations are pre-existing; no new raster provenance entry is needed for this extension.

## Drift not canonized or repaired

The existing `DESIGN.md` predates the current frontmatter/canonical-section format, and `.impeccable/design.json` is absent. This is pre-existing documentation drift, not authorization to rewrite the system or synthesize a sidecar. Both are preserved. Unused readiness step data/styles remain in source after the UI removal; they are not promoted into design guidance. Fixed status/focus colors are not promoted into new global tokens.

This was a source/documentation pass only. No browser calls, runtime tests or visual verification were performed by this reviewer; existing verification claims in the operational guide were not independently rerun here.
