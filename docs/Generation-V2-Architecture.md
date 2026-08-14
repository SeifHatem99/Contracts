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
