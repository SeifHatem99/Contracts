# Generation V2 Architecture Notes

## Cleanup Pass Summary

This pass normalized the remaining legacy contract-type references so the application now reads contract metadata from `js/contracts/contract-definitions.js` in the places where duplication had been creating drift.

### References normalized

- Contract selector labels in the create-contract form now come from the canonical registry.
- Template filename resolution now comes from the canonical registry instead of a separate template map.
- Deal normalization now resolves stored contract types and labels through the canonical registry.
- Storage seeding now builds master templates from the canonical registry.
- Supported contract-type validation now derives from the canonical registry.
- Contract label assignment in app workflow code now uses a registry helper.
- Generated filename labels now use canonical `filenameLabel` metadata, with `psa_marketing` simplified to `PSA` for exports.
- Generated filenames now use the street portion before the first comma in the stored property address.

### References intentionally kept local

- Body/bullet sentence lists remain in `js/components/contract-form.js` because they are contract-specific UI behavior, not metadata.
- Purchase price / cash-at-close calculations remain in the form and validation engines because they are workflow logic, not registry data.
- Placeholder transformation and DOCX generation remain in the document pipeline modules.
- Legacy alias compatibility remains in the registry and storage normalization so existing saved data continues to resolve.

### Backward compatibility

- Existing saved deals and templates are not migrated or deleted.
- Legacy aliases such as `Purchase Agreement`, `Assignment Agreement`, and `Price Addendum` continue to resolve to the same canonical contract IDs.
- The registry still supports the six current contract types:
  - `psa`
  - `psa_marketing`
  - `aif`
  - `novation`
  - `addendum`
  - `cancellation`

## Notes

The goal of this cleanup was reduction of duplication, not a behavior change. Contract-specific workflow logic should continue to live in the modules that own generation, validation, and UI behavior.

## Company and Signature Extension

The new Generation V2 company layer follows the same rule: canonical metadata belongs in `js/contracts/`, while placeholder resolution and DOCX cleanup remain in the document pipeline.

- Company names and owners now resolve from a single registry.
- The form stores a stable company ID instead of a hard-coded company name.
- `COMPANY_NAME` and `COMPANY_OWNER` are resolved through the canonical data layer.
- Seller 2 removal is paragraph-scoped and deterministic: only the exact paragraph containing `{{SELLER_SIGNATURE_2}}` is removed when that value is empty.

## Filename Rule

Generated filenames use the street portion of the property address plus the canonical export label:

- `123 Main St, Cincy, OH 42345` -> `123 Main St - PSA.docx`
- `123 Main St, Cincy, OH 42345` -> `123 Main St - PSA.pdf`

The street portion is the text before the first comma. The full stored property address is not modified.

## QA Verification Notes

This pass was visually checked against regenerated DOCX and PDF outputs for the current six contract templates:

- Purchase Agreement
- Purchase Agreement with marketing
- Assignment Agreement
- Novation Agreement
- Price Addendum
- Cancellation Agreement

Validated items:

- Master templates continue to remain separate from generated contract outputs.
- Canonical company data resolves from one source of truth and no duplicate `LLC` text remains in the rendered company lines.
- `SELLER_SIGNATURE_2` is removed deterministically when empty instead of leaving a blank placeholder block.
- Generated filenames continue to use the street portion of the stored address plus the canonical export label.

Observed layout notes:

- Company and signature text now render consistently across the validated templates.
- The addendum, cancellation, and novation templates preserve their existing section layout after the company placeholder normalization.
