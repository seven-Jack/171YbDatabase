import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG} from '../../src/data/catalog.js';
import {diagramSourceNumber,renderDiagramSourceMarks,renderDiagramProvenanceIndexHTML,DIAGRAM_SUPPLEMENTAL_SOURCE_COUNT} from '../../src/ui/diagram-references.js';

test('diagram citations preserve publication numbers and do not mislabel internal or legacy data as papers',()=>{
  assert.equal(diagramSourceNumber('ref-01'),1);
  assert.equal(diagramSourceNumber('ref-17'),17);
  assert.equal(diagramSourceNumber('legacy-levels'),CATALOG.sources.references.length+1);
  assert.equal(diagramSourceNumber('legacy-hfs'),CATALOG.sources.references.length+2);
  assert.notEqual(diagramSourceNumber('internal-t2-calibration'),1);
  assert.notEqual(diagramSourceNumber('this-work-hyperfine-65s'),17);
  assert.equal(diagramSourceNumber('unknown'),null);
});

test('compact citation marks resolve actual source records, deduplicate and omit unknowns',()=>{
  const html=renderDiagramSourceMarks(['internal-t2-calibration','ref-01','ref-01','unknown']);
  assert.match(html,/<sup class="diagram-source-marks">/);
  assert.equal((html.match(/href=/g)||[]).length,2);
  assert.match(html,/href="#diagram-source-ref-01"/);
  assert.match(html,/href="#diagram-source-internal-t2-calibration"/);
  assert.match(html,/T2 internal calibration/);
  assert.match(html,/定义待核查/);
  assert.doesNotMatch(html,/unknown/);
  assert.equal(renderDiagramSourceMarks(['unknown']), '');
});

test('every supplemental citation has an honest provenance destination and saved 65S artifact',()=>{
  const html=renderDiagramProvenanceIndexHTML();
  assert.equal(DIAGRAM_SUPPLEMENTAL_SOURCE_COUNT,CATALOG.sources.sources.length);
  for(const source of CATALOG.sources.sources) assert.ok(html.includes(`id="diagram-source-${source.id}"`));
  assert.match(html,/0\.543 ea₀/);
  assert.match(html,/0\.5398\(6\)/);
  assert.match(html,/有效 F 级约化量/);
  assert.match(html,/href="assets\/05\.21_yb171_65s_hyperfine\.csv"/);
  assert.match(html,/独立实验验证与总模型不确定度尚未建立/);
  assert.doesNotMatch(html,/已验证|已完成原文复核/);
});
