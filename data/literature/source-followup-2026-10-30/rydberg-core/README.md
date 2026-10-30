# Aymar1984 / Fisk1997 source extraction

Read-only original-source work, 2026-10-30. No original PDF was changed, no MQDT or other scientific model ran, no canonical file was edited by this subtask.

- `manifest.json`: eight numbered tables, 408 records, source paths and SHA256; original hashes compared with the parent task's pre-extraction manifest.
- `aymar-table1-coverage.*`: all24coverage/uncertainty/forbidden/unlisted cells.
- `aymar-table2-starting-energies.*`: all15intermediate-reference cells, including source blank and text-defined chosen-reference uncertainty.
- `aymar-table3-levels-174yb.*`: all289states/perturbers across four subtables (15+145+76+53), with source labels and unambiguous174Yb scope.
- `aymar-table4-mixing.*`: all12tentative assignments; blank small coefficients remain unreported, not0.
- `fisk-all-tables.*` and `fisk-tablei/ii/iii/iv.*`: all68two-trap settings/measured/model/correction records, with precise decimal strings.
- `source-facts.json`: conditional source facts and short arithmetic checks; no re-fitting or model execution.
- `canonical-proposals.json`: suggested parent integration only, not applied.
- `raw/`: complete table-containing and definition/context pages.
- `rendered/`: inspected source images; PDF text artifacts are not accepted as numeric truth without source-image comparison.
- `extract.py`: reproducible assembly; parent fulltext inputs are retained one directory above.

Critical limits: Aymar is174Yb and does not identify full singlet/triplet mixing from energy fits; Table3/Table4 A3 assignments disagree. Fisk's precise result is an isolated-ion zero-temperature/velocity/E/B extrapolation relativeTAI, not a finite-temperature trap frequency. Its table physical shifts and applied correction signs differ. Different publication values and fitted MQDT thresholds are not silently combined.

Chinese audit: `references/audits/followup-rydberg-core-20261030.md` from repository root.
