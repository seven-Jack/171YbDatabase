import test from 'node:test';
import assert from 'node:assert/strict';
import {readDiagramGeometry} from '../../src/ui/diagram-geometry.js';

const line=(coords,matrix)=>({
  ...Object.fromEntries(['x1','y1','x2','y2'].map((key,i)=>[key,{baseVal:{value:coords[i]}}])),
  getScreenCTM:()=>matrix
});
function fixture(segments=[],levels=[],labels=[]) {
  const plot={left:40,right:1040,top:80,bottom:840};
  const matches={'.transition-line .hit-zone':segments,'.core-level-group > line:first-child':levels,'.core-level-group text':labels};
  return {getBoundingClientRect:()=>plot,querySelectorAll:selector=>matches[selector]||[]};
}

test('diagram geometry uses each SVG screen transform, including scaling, translation and skew',()=>{
  const a=line([10,20,30,40],{a:2,b:0,c:0,d:3,e:100,f:-50});
  const b=line([-1,2,3,4],{a:0,b:1,c:-1,d:.5,e:30,f:40});
  const svg=fixture([a,b]);
  const geometry=readDiagramGeometry(svg);
  assert.deepEqual(geometry.segments,[{x1:120,y1:10,x2:160,y2:70},{x1:28,y1:40,x2:26,y2:45}]);
  assert.deepEqual(geometry.plot,{left:40,right:1040,top:80,bottom:840});
});

test('level bars receive the same vertical safety margin without modifying their bounds',()=>{
  const bounds={left:250,right:390,top:369,bottom:369};
  const svg=fixture([],[{getBoundingClientRect:()=>bounds}]);
  assert.deepEqual(readDiagramGeometry(svg).levels,[{left:250,right:390,top:365,bottom:373}]);
  assert.deepEqual(bounds,{left:250,right:390,top:369,bottom:369});
});

test('detached SVG lines and invalid coordinates do not produce unusable obstacles',()=>{
  const matrix={a:1,b:0,c:0,d:1,e:0,f:0};
  const svg=fixture([line([1,2,3,4],null),line([NaN,2,3,4],matrix),line([1,2,3,4],matrix)]);
  assert.deepEqual(readDiagramGeometry(svg).segments,[{x1:1,y1:2,x2:3,y2:4}]);
  assert.deepEqual(readDiagramGeometry(null),{plot:null,segments:[],levels:[]});
});

test('configuration and term labels extending past bars are separately protected and empty labels are ignored',()=>{
  const bar={left:250,right:390,top:369,bottom:369};
  const label={left:85,right:245,top:357,bottom:375};
  const empty={left:0,right:0,top:0,bottom:0};
  const geometry=readDiagramGeometry(fixture([],[{getBoundingClientRect:()=>bar}],[{getBoundingClientRect:()=>label},{getBoundingClientRect:()=>empty}]));
  assert.deepEqual(geometry.levels,[{left:250,right:390,top:365,bottom:373},{left:83,right:247,top:355,bottom:377}]);
  assert.deepEqual(label,{left:85,right:245,top:357,bottom:375});
});
