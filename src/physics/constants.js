/** Values retained from the production page at 2e2e9d5; SI unless noted. */
export const HBAR = 1.054571817e-34;
export const C = 2.99792458e8;
export const EPS0 = 8.8541878128e-12;
export const E_CHARGE = 1.602176634e-19;
export const A0 = 5.29177210903e-11;
export const EA0 = E_CHARGE * A0;
export const I = 0.5;
export const R_INF = 109737.31568160; // cm^-1, retained estimate model
export const E_I_CM = 50443.0676; // cm^-1, retained estimate model
export const E_I_EV = 6.25414330;
// CODATA 2018 a0 mantissa retained; 1 m = 10^6 micrometres.
// NIST Extensive Listing (2018), p.1, Bohr radius.
export const A0_UM = A0 * 1e6;
export const FORMULA_VERSION = '1.0.1';

/** Expected input-domain failure, suitable for an explicit UI error. */
export class PhysicsInputError extends RangeError {
  constructor(field, message, code = 'invalid-input') {
    super(message);
    this.name = 'PhysicsInputError';
    this.field = field;
    this.code = code;
  }
}

export function finiteNumber(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new PhysicsInputError(field, `${field} 必须为有限数值`);
  }
  return value;
}

export function nonnegativeNumber(value, field) {
  finiteNumber(value, field);
  if (value < 0) throw new PhysicsInputError(field, `${field} 不能为负`);
  return value;
}

export function positiveNumber(value, field) {
  finiteNumber(value, field);
  if (value <= 0) throw new PhysicsInputError(field, `${field} 必须大于零`);
  return value;
}
