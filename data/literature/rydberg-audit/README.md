# Rydberg source audit data

This folder preserves source-level extraction and review decisions, separate from canonical website quantities. No MQDT solver, lifetime simulation, or interaction calculation ran in this audit.

- `source-manifest.json`: original PDF paths, SHA-256, page counts, versions, DOI and primary links. Original files were not edited.
- `*.txt`: complete Poppler layout extraction; equations may contain PDF font/OCR artifacts. The originals govern interpretation.
- `extracted-facts.json`: selected audit-relevant numeric facts with isotope, state, conditions and locator.
- `peper-s-f12-tables-s25-s27.json`: complete 171Yb S F=1/2 energy, g and polarizability tables with printed uncertainty notation.
- `halter-table1-174yb.json/.csv`: all 42 states and all printed numeric columns, retained as 174Yb comparison data. Known source-internal alpha0 inconsistencies remain flagged and uncorrected.
- `fang-table1-lifetimes.json`: all 15 table rows plus explicit lifetime definitions and fit scope; isotope unresolved in examined original.
- `internal-evidence/`: unchanged saved R005/R006 artifacts, not newly generated calculations. `internal-evidence-manifest.json` gives their hashes.
- `field-coverage.json/.csv`: every scoped original field, original value, evidence status, source and recommended action; input hashes bind audit snapshot.
- `build_audit.py`: deterministic extraction/coverage assembler, using only saved text/files. Run from any cwd with Python3; PDF-to-text extraction itself is recorded by the manifests and full text.
- `audit-summary.json`: table counts and original-hash integrity check.

See `references/audits/rydberg-sources.md` for Chinese findings and precise limits. `verified-saved-internal-record` means the original saved artifact was located, not independent physical validation. `verified-review-compilation-only` means a review's stated value was checked, not every cited primary experiment.

Additional open-source extraction:

- `lehec-table6-ritz-174yb.json`: all six TableVI rows, fit ranges, Eq2 exponent convention and adopted174Yb threshold.
- `okuno-table1-174yb.json/.csv`: all98TableI resonances, original peak assignments, printed energy and deriveddelta; source-internalRydbergconstant inconsistency flagged.
- `additional-source-excerpts.json`: complete relevant original pages for Lehec MQDT/energy tables and Okuno/Burgers context; mathematical font artifacts remain explicitly unverified.
- `additional-source-facts.json`: separate tweezer/ensemble conditions, no lifetime inferred from pulse duration, and BurgersV1/correctedpublication version boundary.
- `extract_additional.py`: reproducible assembly of those additional saved-source extracts, with no model execution.
