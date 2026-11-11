const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

// R017's pinned Rydcalc Ytterbium171 and SciPy 1.14.1. Both S solvers
// reference the upper ionic threshold, one quarter of the core splitting
// above the ionic hyperfine centroid. The clock reference is energy_from_3P0_Hz.
const spectroscopy = {
  c_m_s: 299792458,
  rydberg_Hz: 3289831402277540,
  ionCentroid_Hz: 1512246455360000,
  ionCoreSplitting_Hz: 12642812124.2,
  clock_Hz: 518295836590863.61,
  planck_eV_s: 6.62607015e-34 / 1.602176634e-19
};

function deriveSpectrum(nu, constants) {
  const { c_m_s, rydberg_Hz, ionCentroid_Hz, ionCoreSplitting_Hz, clock_Hz } = constants;
  const level_Hz = ionCentroid_Hz + ionCoreSplitting_Hz / 4 - rydberg_Hz / nu ** 2;
  const frequency_Hz = level_Hz - clock_Hz;
  return { level_Hz, frequency_Hz, wavelength_nm: c_m_s * 1e9 / frequency_Hz };
}

function importSeries(directory) {
  const receipt = JSON.parse(fs.readFileSync(path.join(directory, 'selected.json'), 'utf8'));
  const bytes = fs.readFileSync(path.join(directory, 'dataset.json'));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (receipt.files.find(file => file.path === 'dataset.json')?.sha256 !== sha256) {
    throw new Error('R017 dataset.json does not match selected.json');
  }
  const data = JSON.parse(bytes);
  const conditions = data.physical_conditions;
  if (data.schema_version !== 'R017-delivery-1' || data.source_commit !== 'd17b981af24b0ef7132819d53504bc84c42f95b2' ||
      data.M_DF_DJ_unit !== 'e*a0' || conditions.isotope !== '171Yb' || conditions.B_T !== 0 ||
      conditions.static_E_V_per_m !== 0 || data.states.length !== 144 || data.channels.length !== 720) {
    throw new Error('Unexpected R017 model, conditions, or coverage');
  }
  const states = data.states.map(row => {
    if (row.L !== 0 || row.F_initial !== 0.5 || row.B_T !== 0 ||
        !Number.isFinite(row.nu_actual) || !Number.isFinite(row.D_F_ea0)) {
      throw new Error(`Unexpected R017 row: ${row.state_id}`);
    }
    return {
      n: row.n_label, Fp: row.F_final, nu: row.nu_actual, dipole_ea0: row.D_F_ea0,
      ...deriveSpectrum(row.nu_actual, spectroscopy),
      sourceStateId: row.state_id,
      originalSelection: row.selection_status,
      identityReview: row.identity_status_current,
      numericalReview: row.numerical_status_current
    };
  });
  return {
    schemaVersion: 1, isotope: 171, B_T: 0, E_V_m: 0, sourceId: 'internal-r017-ns-20261111',
    sourceBatch: receipt.batch_id, sourceSha256: sha256, rydcalcCommit: data.source_commit,
    scipyVersion: '1.14.1', nuReference: 'ionic F_c=1', physicalUncertainty: null, spectroscopy, states
  };
}

module.exports = { deriveSpectrum };

if (require.main === module) {
  if (process.argv.length !== 3) throw new Error('Usage: node scripts/import-rydberg-series.cjs <R017 delivery data directory>');
  const series = importSeries(process.argv[2]);
  const { validateRydbergSeries } = require('./validate-data.cjs');
  validateRydbergSeries(series);
  fs.writeFileSync(path.join(__dirname, '../data/rydberg-series.json'), JSON.stringify(series, null, 2) + '\n');
}
