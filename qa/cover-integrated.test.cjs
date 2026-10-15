/* Independent CPU/DOM verification for the isolated TiTarps preview.
 * Run: node --test verification/cover-preview.test.cjs
 * This tests the actual generated preview.js without editing production sources.
 * DOM, requestAnimationFrame and WebGLRenderer are mocked. It does not replace
 * real-browser visual, native range keyboard, or touch-gesture QA.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {test} = require('node:test');
const Three = require('../larry-three.min.js');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'larry.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'roof-cover.js'), 'utf8');
const expectedGeometryHash = '5189dea7226ce32b71734c709bb4bcd90dd8a0c30c6081e869fa64a34c80554c';
const phaseValues = [...html.matchAll(/<button\b[^>]*data-stage="([^"]+)"/g)].map(m=>m[1]);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const near = (a,b,tolerance=1e-5,message='') => assert.ok(Math.abs(a-b)<=tolerance, `${message}: ${a} vs ${b}`);
function createHarness({reduced=true,width=960,height=540,missingThree=false,rendererFails=false,lateRenderFails=false,code=source}={}) {
  const nodes=new Map(),frames=new Map(),resizeCallbacks=[],intersectionCallbacks=[],errors=[];
  let nextFrame=0,now=1000,captured,renderCount=0;
  class Element {
    constructor(selector) {
      this.selector=selector;this.dataset={};this.style={};this.attrs={};this.listeners={};this.children=[];
      this.hidden=false;this.disabled=false;this.value='0';this.removed=false;this.textContent='';
      const classes=new Set();
      this.classList={toggle:(key,yes)=>{if(yes===undefined)yes=!classes.has(key);yes?classes.add(key):classes.delete(key);},contains:key=>classes.has(key),add:key=>classes.add(key)};
    }
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
    dispatch(type,extra={}){if(this.disabled&&['click','input','change'].includes(type))return;for(const fn of this.listeners[type]??[])fn({target:this,currentTarget:this,pointerId:1,preventDefault(){},...extra});}
    setAttribute(k,v){this.attrs[k]=String(v)} getAttribute(k){return this.attrs[k]??null} removeAttribute(k){delete this.attrs[k]}
    appendChild(child){this.children.push(child)}
    querySelector(selector){return selector==='canvas'?this.children.find(c=>c.selector==='canvas'&&!c.removed)??null:element(selector)}
    querySelectorAll(selector){return selector==='[data-stage]'?phaseButtons:[]}
    getBoundingClientRect(){return {width,height,x:0,y:0,left:0,top:0,right:width,bottom:height}}
    remove(){this.removed=true} setPointerCapture(){} focus(){} scrollIntoView(){}
  }
  const element=selector=>{if(!nodes.has(selector))nodes.set(selector,new Element(selector));return nodes.get(selector)};
  const phaseButtons=phaseValues.map((value,i)=>{const b=element(`[data-stage="${value}"]`);b.dataset.stage=value;b.setAttribute('aria-pressed',String(i===0));return b});
  const document={body:element('body'),hidden:false,querySelector:element,querySelectorAll:selector=>selector==='[data-stage]'?phaseButtons:[],addEventListener:(...a)=>element('document').addEventListener(...a),createElement:()=>({getContext:()=>({fillRect(){},beginPath(){},lineTo(){},stroke(){}})})};
  const media={matches:reduced,addEventListener:(type,fn)=>media.listener=fn};
  class Renderer {
    constructor(){if(rendererFails)throw Error('WebGL unavailable');this.domElement=new Element('canvas')}
    setPixelRatio(){} setClearColor(){} setSize(){}
    render(scene,camera){if(lateRenderFails)throw Error('Render failure after geometry creation');scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);captured={scene,camera};renderCount++;}
  }
  const context={window:{THREE:missingThree?undefined:{...Three,WebGLRenderer:Renderer},devicePixelRatio:1},document,matchMedia:()=>media,navigator:{},ResizeObserver:class{constructor(fn){this.fn=fn}observe(){resizeCallbacks.push(this.fn)}},IntersectionObserver:class{constructor(fn){this.fn=fn}observe(){intersectionCallbacks.push(this.fn);this.fn([{isIntersecting:true}])}},requestAnimationFrame:fn=>{const id=++nextFrame;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),performance:{now:()=>now},console:{...console,error:(...args)=>errors.push(args.map(String).join(' '))},Math,Float32Array};
  vm.runInNewContext(code,context,{filename:'roof-cover.js'});
  function tick(delta=32){const queued=[...frames.values()];frames.clear();now+=delta;for(const fn of queued)fn(now)}
  function scrub(value){const slider=element('#cover-progress');slider.value=String(value);slider.dispatch('input')}
  function intersection(visible){for(const fn of intersectionCallbacks)fn([{isIntersecting:visible}])}
  tick();
  return {element,phaseButtons,document,media,errors,tick,scrub,intersection,resize(){resizeCallbacks.forEach(fn=>fn())},get captured(){return captured},get pendingFrames(){return frames.size},get renderCount(){return renderCount}};
}
function ready(h){assert.equal(h.element('#model').dataset.ready,'true');assert.equal(h.errors.length,0);assert.ok(h.captured)}
test('mobile capture transfer from canvas retains horizontal dragging until mount release',()=>{
  const h=createHarness();ready(h);const mount=h.element('#model');
  mount.dispatch('pointerdown',{pointerType:'touch',clientX:50,clientY:50});
  mount.dispatch('pointermove',{clientX:65,clientY:50});
  const first=Number(mount.dataset.rotationYaw);
  mount.dispatch('lostpointercapture',{target:mount.querySelector('canvas')});
  mount.dispatch('pointermove',{clientX:100,clientY:50});
  assert.ok(Number(mount.dataset.rotationYaw)>first);
  mount.dispatch('pointerup');const stopped=mount.dataset.rotationYaw;
  mount.dispatch('pointermove',{clientX:200,clientY:50});
  assert.equal(mount.dataset.rotationYaw,stopped);
});
function object(h,name){const result=h.captured.scene.getObjectByName(name);assert.ok(result,name);return result}
function snapshotGeometry(group,selectedAttributes=null){const parts=[];group.traverse(o=>{if(!o.geometry)return;for(const [name,a] of Object.entries(o.geometry.attributes)){if(selectedAttributes&&!selectedAttributes.includes(name))continue;parts.push(name,Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength))}if(o.geometry.index){const a=o.geometry.index.array;parts.push(Buffer.from(a.buffer,a.byteOffset,a.byteLength))}});return hash(Buffer.concat(parts.map(v=>typeof v==='string'?Buffer.from(v):v)))}
function assertFinite(h){h.captured.scene.traverse(o=>{for(const n of [...o.position,...o.scale,...o.quaternion])assert.ok(Number.isFinite(n));if(!o.geometry)return;for(const [key,a] of Object.entries(o.geometry.attributes))for(let i=0;i<a.array.length;i++)assert.ok(Number.isFinite(a.array[i]),`${o.name||o.parent?.name} ${key}[${i}] finite`)});for(const n of [...h.captured.camera.position,...h.captured.camera.projectionMatrix.elements])assert.ok(Number.isFinite(n));}
function projectedBounds(h,{excludeEnteringCover=true}={}){
  const result={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity,points:0};
  const cover=object(h,'White roof membrane');
  h.captured.scene.traverse(o=>{
    if(!o.isMesh||o.name==='reference-ground')return;
    for(let p=o;p;p=p.parent){if(!p.visible)return;if((p===cover||p.name==='Overhead Titanium sheet')&&excludeEnteringCover&&cover.position.x>1e-6)return;}
    const attr=o.geometry.attributes.position,v=new Three.Vector3();
    for(let i=0;i<attr.count;i++){
      v.fromBufferAttribute(attr,i).applyMatrix4(o.matrixWorld).project(h.captured.camera);
      for(const n of v)assert.ok(Number.isFinite(n),'finite projected vertex');
      result.minX=Math.min(result.minX,v.x);result.maxX=Math.max(result.maxX,v.x);result.minY=Math.min(result.minY,v.y);result.maxY=Math.max(result.maxY,v.y);result.points++;
    }
  });
  return result;
}

test('approved geometry retains its exact SHA-256; generated script embeds it unchanged',()=>{
  const geometry=fs.readFileSync(path.join(__dirname,'reference/approved-house-geometry.js'));
  assert.equal(hash(geometry),expectedGeometryHash);
  assert.ok(source.includes(geometry.toString()),'generated preview contains approved source verbatim');
  assert.ok(source.includes(fs.readFileSync(path.join(__dirname,'reference/demo-layers.js'),'utf8')),'generated layers current');
});

test('assembled cover and architectural geometry exactly match an independently run approved baseline',()=>{
  const prefix=source.slice(0,source.indexOf('// Additive marketing layers.'));
  assert.ok(prefix.includes('function fitCamera()'),'approved baseline boundary located');
  const code=prefix+'fitCamera();renderer.render(scene,camera);\n} catch(error){console.error(error);showModelFallback()}\n})();';
  const baseline=createHarness({code}),h=createHarness();ready(baseline);ready(h);h.scrub(100);
  for(const name of ['Michael house architecture','Timber roof framing','White roof membrane'])assert.equal(snapshotGeometry(object(h,name),['position','uv']),snapshotGeometry(object(baseline,name),['position','uv']),name+' equals approved baseline');
});

test('UI declares native reversed 0–100 slider and marketing-only disclaimer',()=>{
  const input=html.match(/<input\b[^>]*id="cover-progress"[^>]*>/)?.[0]??'';
  for(const attr of ['type="range"','min="0"','max="100"','value="0"','step="1"','dir="rtl"','aria-describedby='])assert.ok(input.includes(attr),attr);
  assert.match(html,/not a performance guarantee/i);
  assert.match(html,/aria-live="polite"/);
  assert.equal(phaseValues.length,4);
});

test('native stage shortcuts match the four prescribed checkpoints and headings',()=>{
  assert.deepEqual(phaseValues,['0','45','66','100']);
  const h=createHarness();ready(h);
  const titles=['Damaged tile roof','Position the covering','Lower and conform','Secured covering'];
  h.phaseButtons.forEach((button,i)=>{
    button.dispatch('click');
    assert.equal(h.element('#cover-phase').textContent,titles[i]);
    assert.equal(h.element('#cover-progress').value,phaseValues[i]);
    assert.equal(button.getAttribute('aria-pressed'),'true');
    assert.equal(h.phaseButtons.filter(b=>b.getAttribute('aria-pressed')==='true').length,1);
    assert.ok(h.element('#cover-status').textContent.startsWith(titles[i]));
  });
});

test('position checkpoint remains flat overhead with a matching heading',()=>{
  const h=createHarness();ready(h);h.scrub(45);
  const d=h.element('#model').dataset;
  assert.equal(d.coverX,'0.000');assert.equal(d.coverLift,'1.300');assert.equal(object(h,'White roof membrane').visible,false);const sheet=object(h,'Overhead Titanium sheet');assert.equal(sheet.visible,true);near(sheet.position.y,5.8);near(sheet.material.opacity,1);
  assert.equal(h.element('#cover-phase').textContent,'Position the covering');
});

test('complete forward and reverse scrubbing keeps travel separate from lowering',()=>{
  const h=createHarness();ready(h);const cover=object(h,'White roof membrane'),architecture=object(h,'Michael house architecture');
  const before=snapshotGeometry(architecture);let previousX=Infinity,previousLift=Infinity,previousConform=-Infinity;
  for(let p=0;p<=100;p++){
    h.scrub(p);const d=h.element('#model').dataset;
    assert.equal(Number(d.coverProgress),p/100);assert.equal(d.rotationTilt,'0.000');
    assert.ok(cover.position.x<=previousX+1e-8);assert.ok(cover.position.y<=previousLift+1e-8);assert.ok(Number(d.coverConform)>=previousConform-1e-8);
    if(p<=45){near(cover.position.y,1.3);assert.equal(cover.visible,false);assert.equal(object(h,'Overhead Titanium sheet').visible,p>0)}
    if(p>=45)near(cover.position.x,0);
    if(p>45)assert.equal(cover.visible,true);
    previousX=cover.position.x;previousLift=cover.position.y;previousConform=Number(d.coverConform);
  }
  const secured=snapshotGeometry(cover);
  for(let round=0;round<3;round++){for(let p=100;p>=0;p--)h.scrub(p);for(let p=0;p<=100;p++)h.scrub(p);assert.equal(snapshotGeometry(cover),secured,'cover returns exactly without accumulated deformation')}
  assert.equal(snapshotGeometry(architecture),before,'architecture never mutated');assertFinite(h);
});

test('flat and secured shapes interpolate exactly from approved cover geometry',()=>{
  const h=createHarness();ready(h);const cover=object(h,'White roof membrane');
  h.scrub(100);const originals=cover.children.filter(o=>o.geometry).map(o=>Array.from(o.geometry.attributes.position.array));
  h.scrub(45);const sheet=object(h,'Overhead Titanium sheet');assert.equal(sheet.visible,true);assert.equal(cover.visible,false);const sheetPositions=sheet.geometry.attributes.position;for(let i=0;i<sheetPositions.count;i++)assert.ok(Math.abs(sheetPositions.getY(i))<=.018001,'flat sheet has only subtle ripple');
  h.scrub(66);const conform=Number(h.element('#model').dataset.coverConform);assert.ok(conform>0&&conform<1);
  cover.children.filter(o=>o.geometry).forEach((o,j)=>{const a=o.geometry.attributes.position.array;for(let i=0;i<a.length;i++){if(i%3===1)near(a[i],4.5+(originals[j][i]-4.5)*.648,1e-5);else assert.equal(a[i],originals[j][i])}});
  h.scrub(100);cover.children.filter(o=>o.geometry).forEach((o,j)=>assert.deepEqual(Array.from(o.geometry.attributes.position.array),originals[j]));
});

test('secured visualization has zero interior leak paths and active runoff; reverses cleanly',()=>{
  const h=createHarness();ready(h);const leaks=object(h,'Illustrative interior leak paths'),runoff=object(h,'Illustrative diverted runoff');
  h.scrub(0);assert.equal(leaks.visible,true);assert.equal(runoff.visible,false);assert.equal(h.element('#model').dataset.leakIntensity,'1.000');
  h.scrub(66);assert.equal(leaks.visible,true);assert.equal(runoff.visible,false);
  h.scrub(100);assert.equal(leaks.visible,false);assert.equal(leaks.material.opacity,0);assert.equal(runoff.visible,true);near(runoff.material.opacity,.85);assert.equal(h.element('#model').dataset.leakIntensity,'0.000');
  h.element('#weather').dispatch('click');assert.equal(object(h,'Illustrative rain and runoff').visible,false);assert.equal(h.element('#weather').getAttribute('aria-pressed'),'false');
  h.element('#weather').dispatch('click');assert.equal(object(h,'Illustrative rain and runoff').visible,true);
  h.scrub(0);assert.equal(leaks.visible,true);assert.equal(runoff.visible,false);assertFinite(h);
});

test('repeated inspection toggles are reversible and scrubbing always exits inspection',()=>{
  const h=createHarness();ready(h);const cover=object(h,'White roof membrane'),tiles=object(h,'Terracotta tile roof');
  h.scrub(66);const sequenceHash=snapshotGeometry(cover);
  for(let i=0;i<24;i++){
    h.element('#assembly').dispatch('click');assert.equal(h.element('#model').dataset.mode,'exploded');assert.equal(tiles.visible,false);assert.equal(h.element('#assembly').getAttribute('aria-pressed'),'true');near(cover.position.y,2.2);
    h.element('#assembly').dispatch('click');assert.equal(h.element('#model').dataset.mode,'cover-sequence');assert.equal(tiles.visible,true);assert.equal(snapshotGeometry(cover),sequenceHash);
  }
  for(const progress of [0,45,66,100,19,0]){h.element('#assembly').dispatch('click');h.scrub(progress);assert.equal(h.element('#model').dataset.mode,'cover-sequence');assert.equal(h.element('#assembly').getAttribute('aria-pressed'),'false');assert.equal(tiles.visible,progress<98)}
});

test('upright yaw stays within ±30° under buttons, keyboard, and horizontal drag',()=>{
  const h=createHarness();ready(h);const model=h.element('#model');const lower=.22-Math.PI/6,upper=.22+Math.PI/6;
  const check=()=>{const y=Number(model.dataset.rotationYaw);assert.ok(y>=lower-.00051&&y<=upper+.00051);assert.equal(model.dataset.rotationTilt,'0.000');const root=object(h,'Michael house architecture').parent.parent;assert.equal(root.rotation.x,0);assert.equal(root.rotation.z,0)};
  for(let i=0;i<50;i++){h.element('#rotate').dispatch('click');check()}near(Number(model.dataset.rotationYaw),upper,.00051);
  for(let i=0;i<50;i++){model.dispatch('keydown',{key:'ArrowLeft'});check()}near(Number(model.dataset.rotationYaw),lower,.00051);
  model.dispatch('keydown',{key:'Home'});near(Number(model.dataset.rotationYaw),.22,.00051);
  for(const x of [-10000,10000]){model.dispatch('pointerdown',{clientX:0,clientY:0,pointerType:'touch'});model.dispatch('pointermove',{clientX:x,clientY:0,pointerType:'touch'});check();model.dispatch('pointerup',{clientX:x,clientY:0,pointerType:'touch'})}
  h.element('#reset-view').dispatch('click');near(Number(model.dataset.rotationYaw),.22,.00051);
  model.dispatch('pointerdown',{clientX:0,clientY:0,pointerType:'touch'});model.dispatch('pointermove',{clientX:2,clientY:100,pointerType:'touch'});near(Number(model.dataset.rotationYaw),.22,.00051);model.dispatch('pointercancel');
});

test('reduced motion settles without a continuing animation loop; user play works',()=>{
  const h=createHarness({reduced:true});ready(h);assert.equal(h.pendingFrames,0);assert.equal(h.element('#motion').getAttribute('aria-pressed'),'true');
  const count=h.renderCount;for(let i=0;i<20;i++)h.tick();assert.equal(h.renderCount,count);
  h.element('#motion').dispatch('click');h.tick();assert.equal(h.pendingFrames,1);assert.equal(h.element('#motion').getAttribute('aria-pressed'),'false');
  h.media.matches=true;h.media.listener({matches:true});h.tick();assert.equal(h.pendingFrames,0);assert.equal(h.element('#motion').getAttribute('aria-pressed'),'true');
  h.scrub(66);assert.equal(h.pendingFrames,0);assert.equal(h.element('#model').dataset.coverProgress,'0.660');
});

test('running motion stays finite, visibility suspends it, and inspection settles',()=>{
  const h=createHarness({reduced:false});ready(h);assert.equal(h.pendingFrames,1);
  h.scrub(66);for(let i=0;i<200;i++){h.tick();const y=Number(h.element('#model').dataset.rotationYaw);assert.ok(y>=.22-Math.PI/6-.001&&y<=.22+Math.PI/6+.001)}
  h.intersection(false);assert.equal(h.pendingFrames,0);h.intersection(true);assert.equal(h.pendingFrames,1);
  h.document.hidden=true;h.element('document').dispatch('visibilitychange');assert.equal(h.pendingFrames,0);h.document.hidden=false;h.element('document').dispatch('visibilitychange');assert.equal(h.pendingFrames,1);
  h.element('#assembly').dispatch('click');for(let i=0;i<150;i++)h.tick();near(Number(h.element('#model').dataset.coverLift),2.2,.001);
  h.scrub(0);assert.equal(h.element('#model').dataset.mode,'cover-sequence');assertFinite(h);
});

test('mobile and desktop camera bounds contain architectural and in-position cover vertices',()=>{
  const samples=[];
  for(const [width,height] of [[294,460],[345,460],[460,460],[740,470],[960,530],[1300,590]]){
    const h=createHarness({width,height});ready(h);
    for(const yaw of ['left','center','right']){
      h.element('#reset-view').dispatch('click');if(yaw!=='center')for(let i=0;i<5;i++)h.element(yaw==='left'?'#rotate-left':'#rotate').dispatch('click');
      for(const progress of [0,22,45,66,80,100]){
        h.scrub(progress);const b=projectedBounds(h);samples.push({width,height,yaw,progress,...b});
        assert.ok(b.points>0);assert.ok(b.minX>=-1&&b.maxX<=1&&b.minY>=-1&&b.maxY<=1,JSON.stringify(samples.at(-1)));
      }
      h.element('#assembly').dispatch('click');const b=projectedBounds(h);samples.push({width,height,yaw,progress:'exploded',...b});assert.ok(b.minX>=-1&&b.maxX<=1&&b.minY>=-1&&b.maxY<=1,JSON.stringify(samples.at(-1)));
      h.scrub(0);
    }
  }
  fs.writeFileSync(path.join(__dirname,'cover-camera-bounds.json'),JSON.stringify(samples,null,2)+'\n');
});

for(const [label,options] of [['missing Three.js',{missingThree:true}],['WebGL constructor failure',{rendererFails:true}],['first render failure',{lateRenderFails:true}]])test(`fallback handles ${label} and disables every unavailable control`,()=>{
  const h=createHarness(options);assert.equal(h.element('#model').dataset.ready,undefined);assert.equal(h.element('#cover-phase').textContent,'Preview requires WebGL');assert.equal(h.pendingFrames,0);
  for(const id of ['assembly','weather','rotate-left','rotate','reset-view','motion','cover-progress','cover-play'])assert.equal(h.element('#'+id).disabled,true,id);
  for(const button of h.phaseButtons)assert.equal(button.disabled,true,`stage ${button.dataset.stage} disabled`);
  assert.match(h.element('#cover-description').textContent,/still image/);
});

test('WebGL context loss removes canvas, stops motion, and preserves fallback',()=>{
  const h=createHarness({reduced:false});ready(h);const canvas=h.element('#model').querySelector('canvas');assert.ok(canvas);
  canvas.dispatch('webglcontextlost');assert.equal(canvas.removed,true);assert.equal(h.pendingFrames,0);assert.equal(h.element('#model').dataset.ready,undefined);assert.equal(h.element('#cover-progress').disabled,true);for(const button of h.phaseButtons)assert.equal(button.disabled,true);const title=h.element('#cover-phase').textContent;for(const button of h.phaseButtons)button.dispatch('click');assert.equal(h.element('#cover-phase').textContent,title);
});

module.exports={createHarness,projectedBounds};

function advance(h,seconds){for(let i=0;i<Math.ceil(seconds/.04);i++)h.tick(40);}
test('automatic story starts damaged in rain, advances in order and holds secured',()=>{
 const h=createHarness({reduced:false});ready(h);
 assert.equal(h.element('#model').dataset.coverProgress,'0.000');
 assert.equal(object(h,'Terracotta tile roof').visible,true);
 assert.equal(object(h,'Illustrative rain and runoff').visible,true);
 advance(h,1.8);assert.equal(h.element('#model').dataset.coverProgress,'0.000');
 advance(h,2);assert.ok(Number(h.element('#model').dataset.coverX)>0);assert.equal(h.element('#cover-phase').textContent,'Position the covering');
 advance(h,3.3);assert.equal(h.element('#cover-phase').textContent,'Lower and conform');
 advance(h,4);assert.equal(h.element('#model').dataset.coverProgress,'1.000');assert.equal(h.element('#model').dataset.sequenceState,'complete');
 assert.equal(h.element('#cover-play').textContent,'Replay cover');assert.equal(object(h,'Illustrative interior leak paths').visible,false);
 advance(h,1);assert.equal(h.element('#model').dataset.coverProgress,'1.000');
});
test('offscreen and hidden pages retain their damaged opening and suspend elapsed playback',()=>{
 const h=createHarness({reduced:false});ready(h);h.intersection(false);advance(h,4);assert.equal(h.element('#model').dataset.coverProgress,'0.000');
 h.intersection(true);advance(h,3);const p=h.element('#model').dataset.coverProgress;assert.ok(Number(p)>0);
 h.document.hidden=true;h.element('document').dispatch('visibilitychange');advance(h,5);assert.equal(h.element('#model').dataset.coverProgress,p);
 h.document.hidden=false;h.element('document').dispatch('visibilitychange');advance(h,.5);assert.ok(Number(h.element('#model').dataset.coverProgress)>Number(p));
});
test('pause/resume preserves progress; manual scrubbing stops automatic movement; replay starts in rain',()=>{
 const h=createHarness({reduced:false});ready(h);advance(h,3);
 h.element('#cover-play').dispatch('click');const p=h.element('#model').dataset.coverProgress;advance(h,1);assert.equal(h.element('#model').dataset.coverProgress,p);assert.equal(h.element('#cover-play').textContent,'Resume cover');
 h.element('#cover-play').dispatch('click');advance(h,.5);assert.ok(Number(h.element('#model').dataset.coverProgress)>Number(p));
 h.element('#motion').dispatch('click');const paused=h.element('#model').dataset.coverProgress;advance(h,1);assert.equal(h.element('#model').dataset.coverProgress,paused);
 h.element('#motion').dispatch('click');advance(h,.5);assert.ok(Number(h.element('#model').dataset.coverProgress)>Number(paused));
 h.scrub(45);advance(h,1);assert.equal(h.element('#model').dataset.coverProgress,'0.450');
 h.element('#weather').dispatch('click');h.element('#assembly').dispatch('click');h.element('#cover-play').dispatch('click');
 assert.equal(h.element('#model').dataset.coverProgress,'0.000');assert.equal(h.element('#model').dataset.mode,'cover-sequence');assert.equal(h.element('#weather').getAttribute('aria-pressed'),'true');
 advance(h,1);assert.equal(h.element('#model').dataset.coverProgress,'0.000');advance(h,2);assert.ok(Number(h.element('#model').dataset.coverProgress)>0);
});
test('reduced motion leaves a static damaged roof until an explicit Play cover request',()=>{
 const h=createHarness({reduced:true});ready(h);advance(h,12);assert.equal(h.element('#model').dataset.coverProgress,'0.000');assert.equal(h.pendingFrames,0);assert.equal(h.element('#cover-play').textContent,'Play cover');
 h.element('#cover-play').dispatch('click');advance(h,3);assert.ok(Number(h.element('#model').dataset.coverProgress)>0);
 h.media.matches=true;h.media.listener({matches:true});h.tick();const p=h.element('#model').dataset.coverProgress;advance(h,1);assert.equal(h.element('#model').dataset.coverProgress,p);assert.equal(h.pendingFrames,0);
});
