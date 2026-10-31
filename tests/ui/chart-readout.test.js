import test from 'node:test';
import assert from 'node:assert/strict';
import {findNearestCurvePoint, buildFocusRanges} from '../../src/ui/chart-readout.js';

const rect = {left:10,top:10,width:100,height:100};
const curve = (id, points, visible = true) => ({id,points,visible});
const line = (id, y, visible = true) => curve(id,[{x:10,y},{x:110,y}],visible);
const nearest = (patch = {}) => findNearestCurvePoint({x:60,y:52,curves:[line('w25',40),line('w50',60)],rect,...patch});
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≈ ${expected}`);

test('nearest visible curve is chosen by screen distance and respects the default CSS-pixel threshold', () => {
  const result = nearest();
  assert.equal(result.curveId,'w50');
  assert.equal(result.curveIndex,1);
  assert.equal(result.x,60); assert.equal(result.y,60); assert.equal(result.distance,8);
  assert.equal(nearest({y:100}),null);
  assert.equal(nearest({y:100,maxDistance:Infinity}).curveId,'w50');
  assert.equal(nearest({y:78}).distance,18);
  assert.equal(nearest({y:78.01}),null);
});

test('projection follows a diagonal curve rather than merely sampling the cursor x coordinate', () => {
  const result = nearest({x:60,y:70,curves:[curve('diagonal',[{x:10,y:10},{x:110,y:110}])]});
  close(result.x,65); close(result.y,65); close(result.distance,Math.sqrt(50)); close(result.segmentT,.55);
});

test('hidden curves, points outside the plot, and segments wholly outside the plot cannot be selected', () => {
  assert.equal(nearest({curves:[line('hidden',52,false)]}),null);
  assert.equal(nearest({x:9.99}),null);
  assert.equal(nearest({y:110.01}),null);
  assert.equal(nearest({x:60,y:10,curves:[line('above',9)],maxDistance:Infinity}),null);
  assert.equal(nearest({x:10,y:60,curves:[curve('left',[{x:0,y:10},{x:0,y:110}])],maxDistance:Infinity}),null);
});

test('only the clipped portion of a series is used, including crossings with both endpoints outside', () => {
  const result = nearest({x:10,y:50,curves:[curve('crossing',[{x:-90,y:-90},{x:210,y:210}])],maxDistance:Infinity});
  assert.ok(result.x >= rect.left && result.y >= rect.top);
  close(result.x,30); close(result.y,30);
  const boundary = nearest({x:10,y:10,curves:[curve('crossing',[{x:-90,y:-90},{x:210,y:210}])]});
  close(boundary.x,10); close(boundary.y,10); close(boundary.distance,0); close(boundary.segmentT,1/3);
});

test('invalid samples break a curve instead of connecting across missing data', () => {
  const curves = [curve('gap',[{x:10,y:10},{x:NaN,y:10},{x:110,y:10}])];
  assert.equal(nearest({x:60,y:10,curves}),null);
  assert.equal(nearest({curves:[curve('bad',[null,{x:60,y:52}])]}),null);
});

test('single points, repeated points, empty curves and ties have deterministic behavior without mutation', () => {
  const input = {x:60,y:52,rect,curves:[curve('first',[{x:60,y:52}]),curve('second',[{x:60,y:52},{x:60,y:52}]),curve('empty',[])]};
  const original = JSON.stringify(input);
  assert.equal(findNearestCurvePoint(input).curveId,'first');
  assert.equal(JSON.stringify(input),original);
  assert.equal(nearest({curves:[curve('empty',[])]}),null);
});

test('screen-space hit testing works with the nonuniform sampling produced by a logarithmic power axis', () => {
  const minimum = .001, maximum = 100;
  const x = power => 10 + (Math.log10(power)-Math.log10(minimum))/(Math.log10(maximum)-Math.log10(minimum))*100;
  const points = [.001,.01,.1,1,10,100].map(power=>({x:x(power),y:60}));
  const result = nearest({x:x(.1),y:64,curves:[curve('log-waist',points)]});
  const power = 10 ** (Math.log10(minimum)+(result.x-10)/100*(Math.log10(maximum)-Math.log10(minimum)));
  close(power,.1); close(result.distance,4);
  assert.equal(result.curveId,'log-waist');
});

test('malformed geometry, pointer and threshold return no hit without throwing', () => {
  for (const patch of [
    {x:NaN},{y:Infinity},{curves:null},{rect:null},{rect:{...rect,width:0}},
    {rect:{...rect,left:Infinity}},{rect:{...rect,width:Infinity}},
    {maxDistance:-1},{maxDistance:NaN},{maxDistance:'18'},
  ]) assert.equal(nearest(patch),null);
  assert.equal(findNearestCurvePoint(),null);
});

test('working-point focus bounds use canonical quantities without altering inputs', () => {
  const input = {power:10,rabi:2,waist:50,scale:'lin'};
  assert.deepEqual(buildFocusRanges(input),{powerMin:0,powerMax:20,rabiMax:3,waistMin:25,waistMax:75,scale:'lin'});
  assert.deepEqual(input,{power:10,rabi:2,waist:50,scale:'lin'});
  assert.deepEqual(buildFocusRanges({...input,scale:'log'}),{powerMin:1,powerMax:100,rabiMax:3,waistMin:25,waistMax:75,scale:'log'});
});

test('focus remains usable for low clock-power points below the old logarithmic lower bound', () => {
  const focused = buildFocusRanges({power:7e-5,rabi:13.9086e-6,waist:200,scale:'log'});
  assert.ok(focused.powerMin < 7e-5 && focused.powerMax > 7e-5);
  assert.ok(focused.rabiMax > 13.9086e-6 && focused.waistMin < 200 && focused.waistMax > 200);
});

test('focus rejects invalid, zero and overflowing ranges and permits finite small positive spans', () => {
  const base = {power:1,rabi:1,waist:1};
  for (const key of ['power','rabi','waist']) {
    for (const value of [0,-1,NaN,Infinity,'1']) assert.equal(buildFocusRanges({...base,[key]:value}),null);
    assert.equal(buildFocusRanges({...base,[key]:Number.MAX_VALUE}),null);
  }
  assert.equal(buildFocusRanges({...base,power:Number.MIN_VALUE,scale:'log'}),null);
  assert.equal(buildFocusRanges({...base,waist:Number.MIN_VALUE}),null);
  assert.equal(buildFocusRanges({...base,scale:'unknown'}),null);
  assert.equal(buildFocusRanges(),null);
  assert.ok(buildFocusRanges({power:1e-200,rabi:1e-200,waist:1e-200,scale:'log'}));
});
