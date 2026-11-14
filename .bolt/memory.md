# Project memory

## Product intent & audience

- Browser-based educational spelling game for children.
- Bilingual: French and English (both supported for UI text, taunts, and content).
- Features: British English audio, interactive typing, silly sentence rewards, local progress tracking.
- Progressive difficulty across levels (Level 1 = easiest).
- Contains a village scene with enterable buildings (tavern, shop, blacksmith) that serve as gameplay spaces.

## Brand personality & voice

- Child-friendly and encouraging at all times.
- Failure/taunt messages must be playful and non-derogatory — never imply the child can't spell or is pathetic.
- Approved taunt style: "Me voilà !", "Fais attention !", "Prépare-toi !" (fun, neutral challenge phrases).

## Visual design & UX direction

- Grid-based game board with cells that enemies/characters target.
- Typing interaction is core gameplay.
- Game characters ("ennemis") speak short phrases on actions.
- Village scene has a visual reference image the user expects to match closely.
- Building interiors must be richly furnished, not sparse — reference includes: stone fireplace with animated flame and flickering light, wood plank flooring, bordered rugs, barrels with metal bands, tavern bar with wall shelving and colorful mugs, tables and chairs, warm pools of light.
- Buildings should be large enough for interior decoration to read clearly.
- Roofs and eaves become transparent when entering a building so interior is visible.
- Lighting: warm, dense room lighting preferred over flat/minimal lighting.
- Prior gap: "fire" was only a small forge block; interiors were too small and sparsely furnished — user explicitly flagged this mismatch.

## Decisions, constraints & rationale

- **No mean taunts**: Removed insults like "Tu ne sais pas écrire !" and "Pathétique !" in both FR/EN; replaced with playful neutral phrases.
- **Level 1 words phonetically transparent**: Easy-level words must not end in silent letters (e.g., avoid final silent *t*, *s*). Replaced *robot* (silent t), *poulet* (silent t), *souris* (silent s) with *banane*, *salade*, *monde*.
- Rationale: Young children learning to spell should not be penalized by silent-letter mismatches at the easiest level; encouragement keeps engagement high.
- **Enlarged tavern, shop, and blacksmith** to give interiors room for decoration.
- Test suite: ~1,255 tests, all passing after changes.

## Open questions & assumptions

- Should higher levels (2+) also avoid silent letters, or is the constraint scoped to Level 1 only? (Assumed Level 1 only for now.)
- Is French the primary/default language, or are FR and EN equally first-class?
- Audio: confirmed British English for English mode; is French audio also provided or text-only?
- Is the visual reference image available in-repo for direct comparison, or only described verbally?