'use strict';
(() => {
const $ = (s) => document.querySelector(s);
const icons={qr:'<rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><path d="M15 15h3v3h3v3h-6v-3m6-6v3M12 3v6M3 12h6m3 0v3"/>',save:'<path d="M12 3v11m-4-4 4 4 4-4M5 14v6h14v-6"/>',phone:'<path d="m5 3 4 1 1 5-3 2c2 3 3 4 6 6l2-3 5 1 1 4c-1 3-4 3-7 2C7 18 3 12 3 7c0-2 0-3 2-4Z"/>',message:'<path d="M21 11a9 9 0 0 1-13 8l-5 2 2-5A9 9 0 1 1 21 11Z"/><path d="M8 10h8m-8 4h5"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',layers:'<path d="m12 3 10 5-10 5L2 8l10-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5"/>',rain:'<path d="M6 14a4 4 0 0 1-1-8 6 6 0 0 1 11-1 4 4 0 1 1 2 9H6Zm1 3-1 4m7-4-1 4m7-4-1 4"/>',rotate:'<path d="M20 8a9 9 0 1 0 0 9M20 3v6h-6"/>',pause:'<path d="M8 5v14M16 5v14"/>',play:'<path d="m8 4 12 8-12 8V4Z"/>'};
function icon(name){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(icons[name]||'')+'</svg>'}
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const profile=document.body.dataset;
const cardUrl=profile.cardUrl;
const contactName=profile.contactName,contactFirst=profile.contactFirst,contactEmail=profile.contactEmail;
let opener;
function openDialog(dialog,source){opener=source;dialog.showModal();document.body.style.overflow='hidden'}
document.querySelectorAll('[data-share]').forEach(btn=>btn.addEventListener('click',()=>openDialog($('#share-dialog'),btn)));
document.querySelectorAll('[data-connect]').forEach(btn=>btn.addEventListener('click',()=>openDialog($('#connect-dialog'),btn)));
document.querySelectorAll('[data-film]').forEach(btn=>btn.addEventListener('click',()=>{openDialog($('#film-dialog'),btn);const video=$('#field-video');if(!video.getAttribute('src'))video.src='sanibel-chinook.mp4';video.play().catch(()=>{});}));
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{dialog.querySelectorAll('video').forEach(v=>v.pause());document.body.style.overflow='';opener?.focus()});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}})});
async function copyCard(){try{await navigator.clipboard.writeText(cardUrl);$('#share-status').textContent='Link copied. Ready to share.'}catch{$('#share-status').textContent='Copy this link: '+cardUrl}}
$('#copy').addEventListener('click',copyCard);
$('#native-share').addEventListener('click',async()=>{if(navigator.share){try{await navigator.share({title:contactName+' | Titanium Tarps',text:'Connect with '+contactName+' at Titanium Tarps.',url:cardUrl});$('#share-status').textContent='Share sheet opened.'}catch(e){if(e.name!=='AbortError')await copyCard()}}else await copyCard()});
$('#connect-form').addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget);const name=String(data.get('name')).trim();const email=String(data.get('email')).trim();if(!name){event.currentTarget.elements.name.setCustomValidity('Please enter your name.');event.currentTarget.elements.name.reportValidity();return}const company=String(data.get('company')).trim();const topic=String(data.get('topic'));const body=`Hi ${contactFirst},\n\nGreat to connect. I’d like to talk about ${topic.toLowerCase()}.\n\nName: ${name}\nCompany: ${company || 'Not provided'}\nEmail: ${email}\n\n`;window.location.href='mailto:'+contactEmail+'?subject='+encodeURIComponent('Let’s connect: '+topic)+'&body='+encodeURIComponent(body);$('#connect-status').textContent='Your email app should open. Review the message and send it to finish connecting. If it did not open, email '+contactEmail+' directly.'});
$('#connect-form').elements.name.addEventListener('input',event=>event.target.setCustomValidity(''));
const projects=[{category:'COMMERCIAL ROOF PROTECTION',title:'A stronger cover.<br>A clearer path forward.',description:'A Houma warehouse, from exposed roof to a continuous protective membrane. Temporary protection while the permanent solution takes shape.',before:'warehouse-houma-before.jpg',after:'warehouse-houma-after.jpg',beforeAlt:'Houma warehouse before the wrap',afterAlt:'Houma warehouse sealed under a white protective membrane',location:'HOUMA, LOUISIANA'},{category:'CONSTRUCTION ENCLOSURE',title:'Keep the elements out.<br>Keep the project moving.',description:'Weather enclosure on an active stadium construction project. A different kind of protection, built around the needs of the work inside.',after:'stadium-wall-wrap.jpg',afterAlt:'Titanium Tarps white membrane enclosing stadium walls during construction',location:'STADIUM ENCLOSURE · MIAMI, FLORIDA'},{category:'GOVERNMENT & INSTITUTIONAL',title:'Complex structures.<br>One continuous cover.',description:'A federal structure, from exposed scaffolding to a finished membrane enclosure. See the transformation from open to protected.',before:'gov-tower-before.jpg',after:'gov-tower-after.jpg',beforeAlt:'Federal structure with exposed scaffolding',afterAlt:'Federal structure enclosed in white membrane',location:'FEDERAL STRUCTURE · SCAFFOLD ENCLOSURE'}];
function updateCompare() {const v=$('#compare').value;$('#before-layer').style.clipPath=`inset(0 ${100-v}% 0 0)`;$('#compare-line').style.left=v+'%'}
$('#compare').addEventListener('input',updateCompare);
document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{const p=projects[Number(button.dataset.project)];$('#project-category').textContent=p.category;$('#project-title').innerHTML=p.title;$('#project-description').textContent=p.description;$('#photo-location').textContent=p.location;$('#after-image').src='assets/img/gallery/'+p.after;$('#after-image').alt=p.afterAlt;const compare=Boolean(p.before);['#before-layer','#compare','#compare-line','.before-tag'].forEach(s=>$(s).hidden=!compare);if(compare){$('#before-image').src='assets/img/gallery/'+p.before;$('#before-image').alt=p.beforeAlt;$('#compare').value='42';updateCompare()}$('.after-tag').textContent=compare?'PROTECTED':'IN THE FIELD';$('#photo-hint').textContent=compare?'DRAG TO COMPARE ↔':'REAL PROJECT IMAGERY';document.querySelectorAll('[data-project]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))})}));

// Interactive concept model. No engineering values or performance simulation.
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
let paused=motionQuery.matches, visible=true, exploded=false, storm=false, frame;
const motionBtn=$('#motion');
function reflectMotion(){motionBtn.setAttribute('aria-pressed',String(paused));motionBtn.setAttribute('aria-label',paused?'Play animation':'Pause animation');motionBtn.innerHTML='<span class="icon">'+icon(paused?'play':'pause')+'</span>'}
reflectMotion();
try {
if(!window.THREE)throw Error('3D library unavailable');
const T=window.THREE, mount=$('#model');
const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;mount.appendChild(renderer.domElement);mount.dataset.ready='true';
const scene=new T.Scene();const camera=new T.PerspectiveCamera(35,1,.1,100);camera.position.set(8,6.6,10);camera.lookAt(0,.9,0);
scene.add(new T.HemisphereLight(0xe2f3ff,0x1b304c,2.5));const key=new T.DirectionalLight(0xffffff,3.5);key.position.set(-4,8,6);scene.add(key);const rim=new T.DirectionalLight(0x5dadff,3);rim.position.set(5,3,-5);scene.add(rim);
const orbitRoot=new T.Group();scene.add(orbitRoot);orbitRoot.position.y=1.1;
const group=new T.Group();orbitRoot.add(group);group.position.y=-1.1;
const mat=(color,rough=.4,metal=.5,more={})=>new T.MeshStandardMaterial({color,roughness:rough,metalness:metal,...more});
const silver=mat(0xc4d4df,.31,.6), dark=mat(0x172b40,.32,.7), frameMat=mat(0x87bbdc,.3,.7), glass=mat(0x284b67,.23,.48,{transparent:true,opacity:.64});
function box(w,h,d,material,x=0,y=0,z=0,parent=group){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh}
box(6.4,.16,4.5,dark,0,-.2,0);box(5.7,.045,3.8,mat(0x5597c4,.4,.65),0,-.1,0);box(5.45,.11,3.55,dark,0,-.025,0);
const building=new T.Group();group.add(building);box(4.75,1.38,2.95,glass,0,.70,0,building);box(4.85,.13,3.05,silver,0,1.42,0,building);
// Uprights, window grid, and an entry make the architectural scale legible.
for(let x=-2.27;x<=2.3;x+=.757){for(const z of [-1.49,1.49])box(.028,1.22,.035,frameMat,x,.72,z,building)}
for(const y of [.25,.71,1.15])for(const z of [-1.49,1.49])box(4.6,.024,.035,frameMat,0,y,z,building);
for(const x of [-2.39,2.39])for(const z of [-1.4,-.7,0,.7,1.4])box(.03,1.22,.028,frameMat,x,.72,z,building);
box(.66,.83,.035,mat(0x0c2439),.36,.45,1.50,building);box(.025,.11,.045,silver,.58,.49,1.53,building);
// Solid timber members make the structure recognizable in the exploded view.
const trusses=new T.Group();group.add(trusses);
const grainCanvas=document.createElement('canvas');grainCanvas.width=64;grainCanvas.height=256;
const grain=grainCanvas.getContext('2d');grain.fillStyle='#c79558';grain.fillRect(0,0,64,256);
for(let i=0;i<35;i++){grain.strokeStyle=i%3?'#a8753c50':'#f0cc9270';grain.lineWidth=.5+(i%3)*.4;grain.beginPath();for(let y=0;y<=256;y+=8){const x=(i*13)%64+Math.sin(y*.022+i)*1.8;grain.lineTo(x,y);}grain.stroke();}
const timberTexture=new T.CanvasTexture(grainCanvas);timberTexture.colorSpace=T.SRGBColorSpace;
const timber=mat(0xffffff,.88,0,{map:timberTexture});const connector=mat(0x9c9e98,.65,.55);
function woodBeam(a,b,width=.105,depth=.105){const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from);const beam=box(width,delta.length(),depth,timber,0,0,0,trusses);beam.position.copy(from.add(to).multiplyScalar(.5));beam.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return beam;}
for(let z=-1.35;z<=1.36;z+=.675){
 const left=[-2.42,1.52,z],apex=[0,2.18,z],right=[2.42,1.52,z];
 woodBeam(left,apex,.12,.11);woodBeam(apex,right,.12,.11);woodBeam(left,right,.12,.11);
 woodBeam([0,1.52,z],apex,.085,.085);
 woodBeam([-1.21,1.52,z],[-1.21,1.85,z],.075,.085);woodBeam([1.21,1.52,z],[1.21,1.85,z],.075,.085);
 woodBeam([-1.21,1.52,z],apex,.08,.085);woodBeam([1.21,1.52,z],apex,.08,.085);
 for(const [x,y] of [[-2.35,1.54],[0,2.13],[2.35,1.54],[0,1.52]])box(.17,.13,.012,connector,x,y,z+.061,trusses);
}
woodBeam([-2.35,1.52,-1.42],[-2.35,1.52,1.42],.1,.1);woodBeam([2.35,1.52,-1.42],[2.35,1.52,1.42],.1,.1);
mount.dataset.trussMaterial='wood';
const membrane=new T.Group();group.add(membrane);
const roofGeo=new T.PlaneGeometry(5.2,3.35,40,24);const pos=roofGeo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getY(i);pos.setXYZ(i,x,2.24-Math.abs(x)*.292,z)}roofGeo.computeVertexNormals();
const roof=new T.Mesh(roofGeo,mat(0xebf3f6,.36,.3,{side:T.DoubleSide}));membrane.add(roof);
// Thin blue perimeter traces the membrane without suggesting product construction details.
const roofEdges=new T.LineSegments(new T.EdgesGeometry(roofGeo,25),new T.LineBasicMaterial({color:0x9fd6fc,transparent:true,opacity:.85}));membrane.add(roofEdges);
const ridge=box(.035,.023,3.34,mat(0xb5d8ed),0,2.253,0,membrane);
const glow=new T.Mesh(new T.RingGeometry(3.35,3.37,100),new T.MeshBasicMaterial({color:0x4e9dd4,transparent:true,opacity:.23,side:T.DoubleSide}));glow.rotation.x=-Math.PI/2;glow.position.y=-.25;glow.scale.y=.76;group.add(glow);
// Cosmetic rain: an atmospheric effect, not a wind or water performance model.
const rainCount=130,rainPositions=new Float32Array(rainCount*6);for(let i=0;i<rainCount;i++){const j=i*6,x=(Math.random()-.5)*11,y=Math.random()*7,z=(Math.random()-.5)*7;rainPositions.set([x,y,z,x+.05,y-.22,z],j)}const rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(rainPositions,3));const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:0x87c7f3,transparent:true,opacity:.35}));rain.visible=false;scene.add(rain);
let targetAngle=-.24,targetTilt=0,dragging=false,startX=0,startY=0,startAngle=0,startTilt=0,lastTime=0,explodeAmount=0,autoAngle=0;
function size(){const r=mount.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();draw()}
function draw(){renderer.render(scene,camera)}
function apply(){orbitRoot.rotation.set(targetTilt,targetAngle+autoAngle,0,'YXZ');membrane.position.y=explodeAmount*1.05;trusses.position.y=explodeAmount*.3;rain.visible=storm;mount.dataset.rotationYaw=(targetAngle+autoAngle).toFixed(3);mount.dataset.rotationTilt=targetTilt.toFixed(3);draw()}
function animate(now=0){frame=null;if(!visible||document.hidden)return;const dt=Math.min((now-lastTime)/1000||0,.04);lastTime=now;if(!paused&&!dragging){autoAngle+=dt*.11;orbitRoot.position.y=1.1+Math.sin(now*.00065)*.035}const target=exploded?1:0;if(paused||motionQuery.matches)explodeAmount=target;else explodeAmount+=(target-explodeAmount)*.065;if(storm&&!paused){for(let i=0;i<rainCount;i++){let j=i*6;rainPositions[j+1]-=dt*3.5;rainPositions[j+4]-=dt*3.5;if(rainPositions[j+1]<-.3){rainPositions[j+1]=6.5;rainPositions[j+4]=6.28}}rainGeo.attributes.position.needsUpdate=true}apply();if(!paused||Math.abs(explodeAmount-target)>.001)frame=requestAnimationFrame(animate)}
function schedule(){if(frame===null||frame===undefined){lastTime=performance.now();frame=requestAnimationFrame(animate)}}
function manual(){paused=true;reflectMotion();}
function resetView(){targetAngle=-.24;targetTilt=0;autoAngle=0;orbitRoot.position.y=1.1;apply();}
mount.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;manual();dragging=true;startX=e.clientX;startY=e.clientY;startAngle=targetAngle;startTilt=targetTilt;mount.setPointerCapture(e.pointerId)});
mount.addEventListener('pointermove',e=>{if(!dragging)return;targetAngle=startAngle+(e.clientX-startX)*.012;targetTilt=startTilt+(e.clientY-startY)*.012;apply()});
['pointerup','pointercancel','lostpointercapture'].forEach(type=>mount.addEventListener(type,()=>{dragging=false;schedule()}));
mount.addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Home'].includes(e.key)){e.preventDefault();manual();if(e.key==='Home'){resetView();return;}if(e.key==='ArrowRight'||e.key==='ArrowLeft')targetAngle+=(e.key==='ArrowRight'?1:-1)*Math.PI/12;else targetTilt+=(e.key==='ArrowDown'?1:-1)*Math.PI/12;apply();}});
$('#rotate').addEventListener('click',()=>{manual();targetAngle+=Math.PI/4;apply()});
$('#tilt').addEventListener('click',()=>{manual();targetTilt+=Math.PI/6;apply()});
$('#reset-view').addEventListener('click',()=>{manual();resetView()});
$('#assembly').addEventListener('click',()=>{exploded=!exploded;$('#assembly').setAttribute('aria-pressed',String(exploded));$('#model-label').textContent=exploded?'Membrane · wood trusses · building':'Membrane over wood trusses';if(paused){explodeAmount=exploded?1:0;apply()}else schedule()});
$('#weather').addEventListener('click',()=>{storm=!storm;$('#weather').setAttribute('aria-pressed',String(storm));$('.experience').classList.toggle('storm',storm);apply();schedule()});
motionBtn.addEventListener('click',()=>{paused=!paused;reflectMotion();schedule()});
motionQuery.addEventListener('change',e=>{paused=e.matches;reflectMotion();schedule()});
new ResizeObserver(size).observe(mount);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else if(frame){cancelAnimationFrame(frame);frame=null}},{rootMargin:'100px'}).observe(mount);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);frame=null}else schedule()});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();delete mount.dataset.ready;$('#model-label').textContent='Project view';if(frame)cancelAnimationFrame(frame);$('#assembly').disabled=true;$('#weather').disabled=true;$('#rotate').disabled=true;$('#tilt').disabled=true;$('#reset-view').disabled=true;motionBtn.disabled=true});
size();schedule();
} catch(error){$('#model-label').textContent='Project view';$('#assembly').hidden=true;$('#weather').hidden=true;$('#rotate').hidden=true;$('#tilt').hidden=true;$('#reset-view').hidden=true;motionBtn.hidden=true;$('.model-note span').textContent='TITANIUM TARPS · IN THE FIELD';$('#model').removeAttribute('tabindex');$('#model').setAttribute('aria-label','Warehouse roof protection project photograph');}
})();
