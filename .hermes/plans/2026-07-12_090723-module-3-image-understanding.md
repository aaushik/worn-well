# Module 3: Image Understanding and Garment Confirmation Plan

> **For Hermes:** Implement this plan task-by-task and pause after the module for user review.

**Goal:** Turn each logged outfit photo into user-reviewed garment records that become trusted wardrobe evidence.

**Architecture:** A server-side Convex action sends the stored image to one vision-capable model and validates its structured response with a strict garment schema. Extracted garments remain provisional until the user edits and confirms them; only confirmed garment IDs may be used by the future stylist.

**Tech Stack:** React, TypeScript, Convex actions/storage, Zod, Vitest, one server-side vision API.

---

## Immediate execution order

### Task 1: Define the extraction contract with tests

**Objective:** Establish the smallest trustworthy garment model before connecting an AI provider.

**Files:**
- Create: `src/domain/garmentAnalysis.ts`
- Create: `src/domain/garmentAnalysis.test.ts`
- Modify: `convex/schema.ts`

**Fields:** category, subtype, primary colour, optional secondary colours, pattern, fit, silhouette, layer position, confidence, and status (`provisional` or `confirmed`).

**Rules:**
- Reject unknown categories rather than silently accepting arbitrary text.
- Never infer mood, comfort, occasion, brand, price, or ownership from pixels.
- Preserve an explicit `unknown` value where the image is insufficient.
- A garment is not stylist-eligible until confirmed.

**Verification:** Run the focused domain test, then Convex type checking.

### Task 2: Add server-side image analysis

**Objective:** Analyze a Convex storage image without exposing model credentials in the browser.

**Files:**
- Create: `convex/analysis.ts`
- Modify: `convex/garments.ts`
- Modify: `.env.example`

**Flow:**
1. Receive an outfit ID.
2. Resolve its stored image URL server-side.
3. Call the configured vision provider with a strict JSON schema.
4. Validate and normalize the response.
5. Replace only provisional extraction results for that outfit.
6. Record extraction status and a safe error message.

**Failure behavior:** Keep the outfit photo, show retry/manual-entry controls, and never fabricate fallback garments.

**Verification:** Test malformed responses, empty detections, retry behavior, and idempotent replacement.

### Task 3: Build garment review and correction UI

**Objective:** Let the user approve what the model actually saw.

**Files:**
- Create: `src/features/garments/GarmentReview.tsx`
- Create: `src/features/garments/GarmentReview.test.tsx`
- Modify: `src/features/outfits/OutfitHistory.tsx`
- Modify: `src/ConnectedApp.tsx`
- Modify: `src/styles.css`

**Experience:**
- Show “Analyzing photo…” immediately after save.
- Display compact editable garment cards.
- Allow category, colour, pattern, and fit corrections.
- Allow deletion of false detections and manual addition of missed garments.
- Provide one clear “Confirm wardrobe items” action.
- Keep photo-only logging fast; review can happen later.

**Verification:** Test edit, delete, add, retry, confirm, and mobile keyboard/layout behavior.

### Task 4: Prevent duplicate wardrobe evidence

**Objective:** Avoid treating the same physical item in several outfit photos as several owned garments.

**Files:**
- Modify: `convex/garments.ts`
- Modify: `src/features/garments/GarmentReview.tsx`

**Approach:** Suggest possible matches using normalized category/colour/pattern attributes, but require the user to choose “same item” or “new item.” Do not attempt embeddings or automatic identity merging in this buildathon module.

**Verification:** Confirm that linking reuses one canonical garment ID and that choosing “new item” preserves both records.

### Task 5: Integrate, deploy, and prove the module

**Objective:** Exercise the complete phone flow against production.

**Steps:**
1. Run all tests, TypeScript checks, and production build.
2. Deploy Convex functions.
3. Deploy the frontend.
4. Upload a real outfit photo from a phone.
5. Verify extraction, correction, confirmation, refresh persistence, and retry behavior.
6. Confirm that provisional garments are excluded from stylist-ready queries.
7. Commit and push the reviewed module.
8. Pause for user approval before Module 4.

## Provider prerequisite

A real image-understanding run requires one server-side vision provider credential. Keep the adapter limited to one provider for the MVP. If no credential is configured, complete the contracts, persistence, manual confirmation path, and UI, but report image analysis as blocked rather than presenting mock output as real AI extraction.

## Definition of done

- A phone photo produces validated provisional garment suggestions.
- The user can correct, remove, add, and confirm garments.
- Confirmed garments persist as canonical wardrobe records.
- The same garment can be linked across outfits without automatic unsafe merging.
- Failures preserve the outfit and offer retry/manual entry.
- No unsupported personal or contextual attributes are inferred.
- Only confirmed garment IDs are exposed to the future stylist.
