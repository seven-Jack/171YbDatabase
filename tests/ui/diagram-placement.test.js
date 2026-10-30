import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseDiagramPanelPosition} from '../../src/ui/diagram-placement.js';

const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const box=(position,panel)=>({...position,right:position.left+panel.width,bottom:position.top+panel.height});

test('uses an exterior lane when the plot leaves enough viewport space',()=>{
  const panel={width:280,height:310},plot={left:340,right:1100,top:100,bottom:820};
  const position=chooseDiagramPanelPosition({viewport:{width:1450,height:900},panel,plot,anchor:{left:650,right:790,top:400,bottom:408}});
  assert.equal(overlaps(box(position,panel),plot),false);
  assert.ok(position.top>=72&&position.top+panel.height<=888);
});

test('chooses a blank corridor instead of covering a full-height transition bundle',()=>{
  const panel={width:220,height:270};
  const position=chooseDiagramPanelPosition({viewport:{width:900,height:750},panel,plot:{left:0,right:900,top:72,bottom:750},anchor:{left:680,right:800,top:500,bottom:510},segments:[390,430,470,510,550,590,630,670,710,750,790,830,870].map(x=>({x1:x,y1:72,x2:x,y2:750}))});
  assert.ok(position.left+panel.width<390,'the card fits the genuinely empty left lane');
});

test('diagonal bounding boxes are not mistaken for opaque occupied rectangles',()=>{
  const panel={width:240,height:260};
  const input={viewport:{width:800,height:700},panel,plot:{left:0,right:800,top:72,bottom:700},anchor:{left:650,right:760,top:520,bottom:530},segments:[{x1:12,y1:72,x2:788,y2:688}],levels:[]};
  const position=chooseDiagramPanelPosition(input),card=box(position,panel);
  // The diagonal spans almost the entire plot, but has clear space beside it.
  const yAtLeft=72+(card.left-12)*(616/776),yAtRight=72+(card.right-12)*(616/776);
  assert.ok(card.bottom<yAtLeft||card.top>yAtRight);
});

test('keeps the hovered level uncovered when another position is available',()=>{
  const panel={width:280,height:320},anchor={left:390,right:530,top:350,bottom:360};
  const position=chooseDiagramPanelPosition({viewport:{width:1000,height:800},panel,anchor,plot:{left:0,right:1000,top:72,bottom:800},levels:[anchor]});
  assert.equal(overlaps(box(position,panel),anchor),false);
});

test('clamps narrow and short viewports without requiring space below the desktop nav',()=>{
  for(const viewport of [{width:320,height:740},{width:320,height:280}]) {
    const panel={width:296,height:viewport.height-24};
    const position=chooseDiagramPanelPosition({viewport,panel,anchor:{left:-30,right:200,top:900,bottom:910},plot:{left:12,right:308,top:-200,bottom:900}});
    assert.ok(position.left>=0&&position.left+panel.width<=viewport.width);
    assert.ok(position.top>=0&&position.top+panel.height<=viewport.height);
    assert.equal(position.left,12);
    assert.equal(position.top,12);
  }
});

test('does not mutate geometry inputs and returns a deterministic placement',()=>{
  const input={viewport:{width:1280,height:900},panel:{width:288,height:330},anchor:{left:880,right:1030,top:600,bottom:608},plot:{left:80,right:1200,top:80,bottom:850},segments:[{x1:500,y1:800,x2:930,y2:600}],levels:[{left:880,right:1030,top:600,bottom:608}]};
  const before=JSON.stringify(input),position=chooseDiagramPanelPosition(input);
  assert.deepEqual(chooseDiagramPanelPosition(input),position);
  assert.equal(JSON.stringify(input),before);
});
