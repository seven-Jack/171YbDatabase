#!/usr/bin/env python3
"""Regenerate exact symbolic angular fixtures; requires SymPy 1.14.0.

This script imports SymPy's implementation, never the production JavaScript.
The normal Node test suite consumes the checked-in JSON and needs no Python.
"""
from pathlib import Path
import json
import sympy as s
from sympy.physics.wigner import clebsch_gordan, wigner_6j

ROOT = Path(__file__).resolve().parents[1]
SPIN = s.Rational(1, 2)


def encode(expr):
    return {"exact": str(s.simplify(expr)), "value": float(expr.evalf(18))}


def values(j):
    return [j - k for k in range(int(2 * j) + 1)]


def fs(j):
    lo, hi = abs(j - SPIN), j + SPIN
    return [lo + k for k in range(int(hi - lo) + 1)]


cg_rows = []
for twice_j in range(6):
    j = s.Rational(twice_j, 2)
    for twice_jp in range(8):
        jp = s.Rational(twice_jp, 2)
        for m in values(j):
            for q in [-1, 0, 1]:
                mp = m + q
                if abs(mp) > jp or (jp - mp).is_integer is not True:
                    continue
                expr = clebsch_gordan(j, 1, jp, m, q, mp)
                cg_rows.append({"args": [float(j), float(m), 1, q, float(jp), float(mp)], **encode(expr)})

sixj_rows = []
angular_rows = []
for J in range(3):
    for Jp in range(3):
        for F in fs(J):
            for Fp in fs(Jp):
                args = [s.Integer(Jp), Fp, SPIN, F, s.Integer(J), s.Integer(1)]
                try:
                    sixj = wigner_6j(*args)
                except ValueError:
                    sixj = s.Integer(0)
                sixj_rows.append({"args2j": [int(2 * v) for v in args], **encode(sixj)})
                dF = (-1) ** int(Jp + SPIN + F + 1) * s.sqrt((2 * Fp + 1) * (2 * F + 1)) * sixj
                for m in values(F):
                    for q in [-1, 0, 1]:
                        mp = m + q
                        if abs(mp) > Fp:
                            continue
                        coeff = clebsch_gordan(F, 1, Fp, m, q, mp)
                        angular = s.simplify(coeff * dF / s.sqrt(2 * Fp + 1))
                        angular_rows.append({"J": J, "Jp": Jp, "F": float(F), "Fp": float(Fp),
                                             "m": float(m), "mp": float(mp), "q": q,
                                             **encode(angular)})

fixture = {
    "metadata": {"generator": "scripts/generate-angular-fixtures.py", "tool": "SymPy",
                 "version": s.__version__, "source": "https://docs.sympy.org/latest/modules/physics/wigner.html",
                 "convention": "Condon-Shortley; CG=<j1 m1; j2 m2|J M>; d_channel=CG*d_F/sqrt(2F'+1)",
                 "scope": "Independent exact angular-algebra reference; not validation of atomic matrix elements or physical state assignment"},
    "clebschGordan": cg_rows, "sixJ": sixj_rows, "angularFactors": angular_rows,
}
output = ROOT / "tests/fixtures/angular.json"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + "\n")
print(f"{output}: {len(cg_rows)} CG, {len(sixj_rows)} 6-j, {len(angular_rows)} angular-factor cases")
