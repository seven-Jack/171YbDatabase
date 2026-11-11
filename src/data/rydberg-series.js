import { canonicalCatalog } from './generated-catalog.js';

const series = canonicalCatalog['rydberg-series'];
const { planck_eV_s } = series.spectroscopy;

export const rydbergFLabel = Fp => Fp === 0.5 ? '1/2' : '3/2';

function makeEntry(row) {
  const { n, Fp, nu, sourceStateId, level_Hz, frequency_Hz, wavelength_nm, dipole_ea0 } = row;
  const id = `NS-${n}-F${Fp * 2}2`;
  const term = `${n}S · F′=${rydbergFLabel(Fp)}`;
  const levelId = `yb171-6s${n}s-f${Fp * 2}2`;
  const conditions = {
    isotope: 171, B_T: 0, E_V_m: 0, n, Fp, nu, nuReference: series.nuReference,
    branch: Fp === 0.5 ? '弱超精细连续跟踪支（混合态）' : 'F′=3/2 单通道',
    identityReview: row.identityReview, numericalReview: row.numericalReview, originalSelection: row.originalSelection
  };
  const quantity = (value, unit, name, evidenceKind, convention, derivedFrom) => ({
    value, unit, quantity: name, evidenceKind, convention, derivedFrom, conditions,
    sourceId: series.sourceId, sourceLocator: sourceStateId, reviewStatus: 'original-source-located',
    uncertainty: null, uncertaintyNote: 'Physical model uncertainty has not been established.'
  });
  const level = {
    id: levelId, isotope: 171, energyReference: 'neutral-atom-ground-state',
    attributes: { term, config: `6s${n}s`, F: Fp, parity: 'even', type: 'rydberg', role: '里德堡 S 态' },
    quantities: {
      energy_eV: quantity(level_Hz * planck_eV_s, 'eV', 'level_energy', 'derived',
        '相对中性原子基态', ['R017 ν_actual', 'RydCalc F_c=1 阈值与质量修正里德堡常数'])
    }
  };
  const frequency = quantity(frequency_Hz / 1e12, 'THz', 'frequency_THz', 'derived',
    '零场普通频率', [`${levelId}.energy_eV`, 'RydCalc ³P₀ 频率基准']);
  const wavelength = quantity(wavelength_nm, 'nm', 'wavelength_vac_nm', 'derived',
    '真空波长 λ=c/f', [`${id}.frequency_THz`]);
  const dipole = quantity(dipole_ea0, 'e*a0', 'hyperfine_reduced_E1_matrix_element', 'internal-calculation', 'F-reduced');
  const presentation = {
    id, lower: '³P₀', upper: term, label: `${n}S 零场激发`, multipole: 'E1', classification: '强',
    color: '#a78bfa', n, Fp, upperJ: 1, nu, frequency_Hz, frequency_THz: frequency.value,
    wavelength_vac_nm: wavelength_nm, d_num: dipole_ea0, fReducedDipoles: { [Fp]: dipole_ea0 },
    branchLabel: conditions.branch, upperEnergy_eV: level.quantities.energy_eV.value
  };
  const record = {
    id, lowerLevelId: 'yb171-6s6p-3p0', upperLevelId: levelId, category: 'rydberg',
    quantities: { wavelength_vac_nm: wavelength, frequency_THz: frequency, d_num: dipole },
    fReducedDipoles: { [Fp]: 'd_num' }, views: { rydberg: { presentation } }
  };
  return { level, record, presentation };
}

export const rydbergEntries = series.states.map(makeEntry);
