"use strict";
(() => {
const $=s=>document.querySelector(s);
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
let paused=motionQuery.matches,visible=true,exploded=false,storm=true,frame=null,modelAvailable=false;
const motionBtn=$('#motion');
function reflectMotion(){motionBtn.setAttribute('aria-pressed',String(paused));motionBtn.setAttribute('aria-label',paused?'Play motion':'Pause motion');motionBtn.textContent=paused?'Play motion':'Pause motion';}
function showModelFallback(){modelAvailable=false;delete $('#model').dataset.ready;$('#model').querySelector('canvas')?.remove();if(frame)cancelAnimationFrame(frame);for(const id of ['assembly','weather','rotate-left','rotate','reset-view','motion','cover-progress']){$('#'+id).disabled=true;}document.querySelectorAll('[data-stage]').forEach(button=>{button.disabled=true;});$('#cover-phase').textContent='Preview requires WebGL';$('#cover-description').textContent='Michael’s approved house is shown as a still image. Open this card in a WebGL-enabled browser.';}
reflectMotion();
try {
if(!window.THREE)throw Error('Three.js unavailable');
// Visual reconstruction of Michael's September 2023 house renders.
// The source images are perspective artwork, not measured CAD or engineering data.
const T=window.THREE, mount=$('#model');modelAvailable=true;
const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;mount.appendChild(renderer.domElement);
const scene=new T.Scene();const camera=new T.PerspectiveCamera(35,1,.1,100);
const viewTarget=new T.Vector3(-.30,1.35,.30),viewDirection=new T.Vector3(2.8,6.8,16).normalize();
scene.add(new T.HemisphereLight(0xf0f0eb,0x777b7b,2.0));const key=new T.DirectionalLight(0xffffff,3.0);key.position.set(-4,8,6);scene.add(key);const rim=new T.DirectionalLight(0xd5d9db,.5);rim.position.set(5,3,-5);scene.add(rim);
const orbitRoot=new T.Group();scene.add(orbitRoot);orbitRoot.position.y=1.5;
const group=new T.Group();orbitRoot.add(group);group.position.y=-1.5;
const mat=(color,rough=.7,metal=.05,more={})=>new T.MeshStandardMaterial({color,roughness:rough,metalness:metal,...more});
const wall=mat(0xd5d5d0,.9,0),trim=mat(0xe9e8df,.85,0),dark=mat(0x29302e,.8,0),glass=mat(0x323b38,.8,0),rail=mat(0x262a28,.7,.05),stone=mat(0x969d9e,.95,0),wrap=mat(0xeeeeea,.88,0,{side:T.DoubleSide}),shutter=mat(0xcacbc3,.95,0);
function box(w,h,d,material,x=0,y=0,z=0,parent=group){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh}
function cylinder(radius,height,material,x,y,z,parent=building,segments=16){const mesh=new T.Mesh(new T.CylinderGeometry(radius,radius,height,segments),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh}
function beam(a,b,width,material,parent,depth=width){const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from);const mesh=box(width,delta.length(),depth,material,0,0,0,parent);mesh.position.copy(from.add(to).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return mesh;}
const groundPlane=new T.Mesh(new T.PlaneGeometry(26,13),stone);groundPlane.rotation.x=-Math.PI/2;groundPlane.position.set(-.55,-.07,.75);groundPlane.name='reference-ground';group.add(groundPlane);
const building=new T.Group();building.name='Michael house architecture';group.add(building);
const trusses=new T.Group();trusses.visible=false;trusses.name='Timber roof framing';group.add(trusses);
const membrane=new T.Group();membrane.name='White roof membrane';group.add(membrane);
// Reference-facing masses. Hidden rear/side surfaces remain inferred from the two JPEGs.
box(2.20,2.91,2.65,wall,-2.20,1.455,-.925,building);
box(1.35,2.91,2.70,wall,-.50,1.455,-.75,building);
box(3.18,2.53,2.65,wall,1.93,1.265,-.80,building);
box(1.40,2.91,2.55,wall,4.28,1.455,-.675,building);
for(const [x,w,h,d,z] of [[-2.20,2.25,2.91,2.70,-.925],[-.50,1.40,2.91,2.75,-.75],[1.93,3.23,2.53,2.70,-.80],[4.28,1.45,2.91,2.60,-.675]])box(w,.085,d,trim,x,h,z,building);
function windowPanel(x,y,z,w,h,yaw=0,divisions=2,material=glass,crossbar=true){
 const pane=box(w,h,.028,material,x,y,z,building);pane.rotation.y=yaw;const right=new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
 for(let i=0;i<=divisions;i++){const offset=-w/2+w*i/divisions,post=box(.028,h+.05,.055,trim,x+right.x*offset,y,z+right.z*offset,building);post.rotation.y=yaw;}
 for(const dy of [-h/2,h/2,...(crossbar?[-h*.08]:[])]){const bar=box(w+.05,.028,.055,trim,x,y+dy,z,building);bar.rotation.y=yaw;}
}
// Two French-door pairs at left, a four-pane projecting bay, and the light upper right bay.
for(const x of [-2.77,-1.80]){windowPanel(x,2.23,.415,.69,1.10);windowPanel(x,.70,.415,.69,1.18);}
windowPanel(-3.18,2.64,.415,.21,.29,0,1,glass,false);
windowPanel(-.50,2.23,.615,1.05,1.10,0,4);windowPanel(-.50,.70,.615,1.05,1.18,0,4);
for(const x of [.95,1.94,2.93])windowPanel(x,.50,.54,.76,.84);
for(const x of [.49,1.445,2.435,3.40])box(.022,2.50,.035,trim,x,1.25,.548,building);
windowPanel(4.28,2.23,.615,1.06,1.10,0,2,shutter,false);windowPanel(4.28,.70,.615,.88,1.18,0,3);
for(const x of [-3.35,-2.34,-1.30,.85,1.90,2.95,4.28])windowPanel(x,.70,-2.18,.65,1.10,Math.PI);
for(const x of [-3.35,-2.34,-1.30,4.28])windowPanel(x,2.12,-2.18,.65,1.10,Math.PI);
for(const z of [-1.65,-.55]){windowPanel(-3.715,.70,z,.58,1.10,-Math.PI/2);windowPanel(4.995,.70,z,.58,1.10,Math.PI/2);}
for(const x of [-3.35,-2.34,-1.30,-1.12,.10,3.48,4.55]){box(.040,.11,.065,dark,x,2.48,.66,building);box(.07,.035,.08,trim,x,2.54,.66,building);}
// The long terrace and deep three-arch fascia are distinct from the curved balconies.
box(3.44,.13,2.55,trim,-2.92,1.65,.20,building);
box(.14,.30,1.42,wall,-4.64,1.85,-.20,building);
function column(x,z,height,radius=.066){cylinder(radius,height,trim,x,height/2,z);cylinder(radius*1.30,.065,trim,x,.035,z);cylinder(radius*1.28,.065,trim,x,height-.03,z);}
for(const x of [-4.64,-3.493,-2.347,-1.20])column(x,1.43,1.17,.065);
function terraceArch(x){const w=1.147,h=.77,shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(-w/2,h);shape.lineTo(w/2,h);shape.lineTo(w/2,0);shape.absellipse(0,0,w/2,.27,0,Math.PI,false);shape.closePath();const mesh=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:false,curveSegments:16}),wall);mesh.position.set(x,.87,1.35);building.add(mesh);}
for(const x of [-4.067,-2.920,-1.773])terraceArch(x);
function railing(a,b,height=.30,material=rail){beam([a[0],a[1]+height,a[2]],[b[0],b[1]+height,b[2]],.024,material,building);beam(a,b,.025,material,building);const length=Math.hypot(b[0]-a[0],b[2]-a[2]),steps=Math.ceil(length/.10);for(let i=0;i<=steps;i++){const t=i/steps;beam([a[0]+(b[0]-a[0])*t,a[1],a[2]+(b[2]-a[2])*t],[a[0]+(b[0]-a[0])*t,a[1]+height,a[2]+(b[2]-a[2])*t],.018,material,building);}}
railing([-4.64,1.72,1.48],[-1.20,1.72,1.48]);railing([-1.20,1.72,1.48],[-1.20,1.72,.48]);
// Long two-flight stair, with solid raking parapets instead of thin rail-like beams.
for(let i=0;i<13;i++){const h=1.66-i*.055;box(.76,.045,.195,trim,-5.02,h-.0225,.52+i*.195,building);}
box(.93,.12,.73,wall,-5.02,.89,2.95,building);
for(let i=0;i<15;i++){const h=.95-i*.064;box(.135,.045,.76,trim,-4.58+i*.135,h-.0225,2.96,building);}
function parapet(a,b,thickness=.12,height=.47){const dx=b[0]-a[0],dz=b[2]-a[2],l=Math.hypot(dx,dz),nx=-dz/l*thickness/2,nz=dx/l*thickness/2,vertices=[];for(const p of [a,b])for(const side of [-1,1])for(const y of [-.10,height])vertices.push([p[0]+side*nx,p[1]+y,p[2]+side*nz]);const indices=[0,1,3,0,3,2,4,6,7,4,7,5,0,4,5,0,5,1,2,3,7,2,7,6,1,5,7,1,7,3,0,2,6,0,6,4],g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(indices.flatMap(i=>vertices[i]),3));g.computeVertexNormals();building.add(new T.Mesh(g,wall));}
parapet([-5.46,1.66,.45],[-5.46,.95,2.92],.12,.25);parapet([-4.59,1.66,.45],[-4.59,1.12,2.32],.12,.25);parapet([-5.42,.95,3.40],[-2.60,.02,3.40],.16,.38);parapet([-4.57,.95,2.54],[-2.60,.02,2.54],.12,.30);
parapet([-5.02,1.64,.45],[-5.02,.93,2.92],.76,0);parapet([-4.58,.93,2.96],[-2.60,0,2.96],.76,0);
// Broad curved balcony aprons and turned balusters follow the original front elevation.
function balcony(cx,cz,radius,y){
 const slab=new T.Mesh(new T.CylinderGeometry(radius,radius,.10,32,1,false,-Math.PI/2,Math.PI),trim);slab.scale.z=.70;slab.position.set(cx,y,cz);building.add(slab);
 const apron=new T.Mesh(new T.CylinderGeometry(radius,radius,.34,32,1,true,-Math.PI/2,Math.PI),wall);apron.scale.z=.70;apron.position.set(cx,y-.15,cz);building.add(apron);
 const profile=[[.018,0],[.024,.04],[.049,.10],[.052,.17],[.035,.24],[.019,.30]].map(p=>new T.Vector2(...p));
 for(let i=0;i<=18;i++){const angle=-Math.PI/2+i*Math.PI/18,spindle=new T.Mesh(new T.LatheGeometry(profile,8),trim);spindle.position.set(cx+Math.sin(angle)*radius,y+.035,cz+Math.cos(angle)*radius*.70);building.add(spindle);}
 const top=new T.Mesh(new T.TorusGeometry(radius,.035,6,40,Math.PI),trim);top.scale.y=.70;top.rotation.x=Math.PI/2;top.position.set(cx,y+.355,cz);building.add(top);
}
balcony(-.50,.65,.82,1.53);balcony(4.28,.65,.70,1.53);
for(const [x,z] of [[-1.15,1.00],[.15,1.00],[3.68,.98],[4.88,.98]])column(x,z,1.43,.048);
// Broad, low covered patio between the two balconies, without covering either one.
box(3.10,.04,2.08,stone,1.90,-.015,1.49,building);
for(const x of [.43,3.17])column(x,2.35,2.68,.092);
box(3.00,.31,.18,trim,1.80,2.63,2.35,building);for(const x of [.35,3.26])box(.14,.31,1.94,trim,x,2.63,1.42,building);
// Left tower: a tall shaft beside the main wing. Large cupola: eight broad, single-pane windows.
cylinder(.57,2.31,wall,-3.35,2.625,-1.06,building,16);cylinder(.605,.09,trim,-3.35,3.75,-1.06,building,16);
for(const angle of [-Math.PI/3,-Math.PI/6,0,Math.PI/6,Math.PI/3])windowPanel(-3.35+Math.sin(angle)*.576,2.78,-1.06+Math.cos(angle)*.576,.22,1.35,angle,1,glass,false);
const cupolaRadius=.82,cupolaBase=2.96,cupolaHeight=.74;cylinder(cupolaRadius,cupolaHeight,wall,1.38,cupolaBase+cupolaHeight/2,-.62,building,8);cylinder(cupolaRadius+.035,.075,trim,1.38,cupolaBase+cupolaHeight-.025,-.62,building,8);
for(let i=0;i<8;i++){const angle=Math.PI/8+i*Math.PI/4,radius=cupolaRadius*Math.cos(Math.PI/8)+.012;windowPanel(1.38+Math.sin(angle)*radius,3.34,-.62+Math.cos(angle)*radius,.43,.43,angle,1,glass,false);}
box(.54,1.49,.52,wall,2.94,3.075,-.60,building);box(.57,.045,.55,trim,2.94,3.84,-.60,building);for(const x of [2.79,3.08])cylinder(.066,.15,trim,x,3.93,-.60,building,12);
const grainCanvas=document.createElement('canvas');grainCanvas.width=64;grainCanvas.height=256;
const grain=grainCanvas.getContext('2d');grain.fillStyle='#c79558';grain.fillRect(0,0,64,256);
for(let i=0;i<35;i++){grain.strokeStyle=i%3?'#a8753c50':'#f0cc9270';grain.lineWidth=.5+(i%3)*.4;grain.beginPath();for(let y=0;y<=256;y+=8){const x=(i*13)%64+Math.sin(y*.022+i)*1.8;grain.lineTo(x,y);}grain.stroke();}
const timberTexture=new T.CanvasTexture(grainCanvas);timberTexture.colorSpace=T.SRGBColorSpace;
const timber=mat(0xffffff,.88,0,{map:timberTexture});
function woodBeam(a,b,width=.065,depth=width){return beam(a,b,width,timber,trusses,depth);}
function roofSurface(vertices,triangles){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(triangles.flatMap(triangle=>triangle.flatMap(i=>vertices[i])),3));geometry.computeVertexNormals();const mesh=new T.Mesh(geometry,wrap);membrane.add(mesh);const outline=new T.LineSegments(new T.EdgesGeometry(geometry,20),new T.LineBasicMaterial({color:0xb3c5cc,transparent:true,opacity:.55}));membrane.add(outline);}
// Separate hip-roof membranes and matching timber framing follow the house's silhouette.
const hipSections=[];
function hipRoof(cx,cz,width,depth,eave,rise,ridgeLength=null,ridgeOffset=0){
 const alongX=width>=depth,length=Math.max(width,depth),span=Math.min(width,depth),ridge=ridgeLength===null?(length-span)/2:ridgeLength/2,top=eave+rise,ridgeLow=-ridge+ridgeOffset,ridgeHigh=ridge+ridgeOffset;
 hipSections.push({cx,cz,width,depth,eave,rise,alongX,ridgeLow,ridgeHigh});
 const point=(u,y,v)=>alongX?[cx+u,y,cz+v]:[cx+v,y,cz+u];
 const vertices=[point(-length/2,eave,-span/2),point(length/2,eave,-span/2),point(length/2,eave,span/2),point(-length/2,eave,span/2),point(ridgeLow,top,0),point(ridgeHigh,top,0)];
 let faces=ridge>.001?[[0,4,5],[0,5,1],[1,5,2],[2,5,4],[2,4,3],[3,4,0]]:[[0,4,1],[1,4,2],[2,4,3],[3,4,0]];
 // The visible membrane is built later as one connected upper envelope.
 if(!alongX)faces=faces.map(face=>face.slice().reverse());
 // Exterior returns are added only at the boundary of the connected envelope.
 // Internal eave strips would cut visibly through intersecting roof planes.
 const below=.055,steps=Math.max(6,Math.ceil(length/.25));
 for(const v of [-span/2,span/2])woodBeam(point(-length/2,eave-below,v),point(length/2,eave-below,v));
 for(const u of [-length/2,length/2])woodBeam(point(u,eave-below,-span/2),point(u,eave-below,span/2));
 if(ridge>.001)woodBeam(point(ridgeLow,top-below,0),point(ridgeHigh,top-below,0),.075);
 for(let i=0;i<=steps;i++){const u=-length/2+length*i/steps,ridgeU=Math.max(ridgeLow,Math.min(ridgeHigh,u));for(const v of [-span/2,span/2])woodBeam(point(u,eave-below,v),point(ridgeU,top-below,0));if(i%3===0){woodBeam(point(u,eave-.07,-span/2),point(u,eave-.07,span/2),.055);woodBeam(point(u,eave-.07,0),point(ridgeU,top-below,0),.045);}}
 for(const t of [.33,.66])for(const sign of [-1,1])woodBeam(point(-length/2+(length/2+ridgeLow)*t,eave+rise*t-below,sign*span/2*(1-t)),point(length/2-(length/2-ridgeHigh)*t,eave+rise*t-below,sign*span/2*(1-t)),.045);
}
function roundRoof(cx,cz,radius,eave,rise){
 const segments=16,vertices=[[cx,eave+rise,cz]];for(let i=0;i<segments;i++){const a=i*Math.PI*2/segments;vertices.push([cx+Math.sin(a)*radius,eave,cz+Math.cos(a)*radius]);}
 roofSurface(vertices,Array.from({length:segments},(_,i)=>[0,i+1,(i+1)%segments+1]));
 cylinder(radius,.10,wrap,cx,eave-.035,cz,membrane,segments);
 for(let i=0;i<segments;i++){woodBeam(vertices[i+1].map((v,j)=>j===1?v-.045:v),[cx,eave+rise-.045,cz],.055);woodBeam(vertices[i+1].map((v,j)=>j===1?v-.045:v),vertices[(i+1)%segments+1].map((v,j)=>j===1?v-.045:v),.055);}
}
hipRoof(-1.675,-.65,4.15,3.05,2.98,1.38,.24,.33);hipRoof(1.91,-.77,3.25,2.80,2.64,.64);hipRoof(4.28,-.63,1.95,2.85,2.98,.45);hipRoof(-.50,.48,1.70,1.70,2.98,.43);hipRoof(1.80,1.43,3.00,2.08,2.79,.34);
roundRoof(-3.35,-1.06,.69,3.83,.48);roundRoof(1.38,-.62,.98,3.76,.53);
// Connected white roof surface. Visible planes are the upper envelope of the
// reference-facing roof volumes; the obscured rear joins are inferred.
// Vertical returns close height changes where adjacent roof footprints meet.
function connectedRoof(){
 const xEdges=hipSections.flatMap(r=>[r.cx-r.width/2,r.cx+r.width/2,r.cx]),zEdges=hipSections.flatMap(r=>[r.cz-r.depth/2,r.cz+r.depth/2,r.cz]);
 const ticks=values=>{const sorted=[...new Set(values)].sort((a,b)=>a-b),result=[];for(let i=0;i<sorted.length-1;i++){const n=Math.ceil((sorted[i+1]-sorted[i])/.055);for(let j=0;j<n;j++)result.push(sorted[i]+(sorted[i+1]-sorted[i])*j/n);}result.push(sorted[sorted.length-1]);return result;};
 const xs=ticks(xEdges),zs=ticks(zEdges),positions=[];
 const covers=(r,x,z)=>Math.abs(x-r.cx)<=r.width/2+1e-7&&Math.abs(z-r.cz)<=r.depth/2+1e-7;
 const height=(x,z,sections)=>Math.max(...sections.filter(r=>covers(r,x,z)).map(r=>{const u=r.alongX?x-r.cx:z-r.cz,v=r.alongX?z-r.cz:x-r.cx,length=r.alongX?r.width:r.depth,span=r.alongX?r.depth:r.width,along=u<r.ridgeLow?(u+length/2)/(r.ridgeLow+length/2):u>r.ridgeHigh?(length/2-u)/(length/2-r.ridgeHigh):1;return r.eave+r.rise*Math.max(0,Math.min(along,1-Math.abs(v)/(span/2)));}));
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){const x0=xs[i],x1=xs[i+1],z0=zs[j],z1=zs[j+1],sections=hipSections.filter(r=>covers(r,(x0+x1)/2,(z0+z1)/2));if(!sections.length)continue;const corners=[[x0,height(x0,z0,sections),z0],[x1,height(x1,z0,sections),z0],[x1,height(x1,z1,sections),z1],[x0,height(x0,z1,sections),z1]];for(const index of [0,2,1,0,3,2])positions.push(...corners[index]);for(const [a,b,dx,dz] of [[0,1,0,-.0001],[1,2,.0001,0],[2,3,0,.0001],[3,0,-.0001,0]]){const A=corners[a],B=corners[b],mx=(A[0]+B[0])/2+dx,mz=(A[2]+B[2])/2+dz;const neighbors=hipSections.filter(r=>covers(r,mx,mz));if(neighbors.length&&(dx<0||dz<0))continue;const lowerA=[A[0],neighbors.length?height(A[0],A[2],neighbors):A[1]-.12,A[2]],lowerB=[B[0],neighbors.length?height(B[0],B[2],neighbors):B[1]-.12,B[2]];if(Math.abs(lowerA[1]-A[1])+Math.abs(lowerB[1]-B[1])<1e-7)continue;for(const p of [A,B,lowerB,A,lowerB,lowerA])positions.push(...p);}}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();membrane.add(new T.Mesh(geometry,wrap));
}
connectedRoof();
// Batch static surfaces by material so the detailed house stays light on mobile GPUs.
function batchMeshes(parent){
 const buckets=new Map();for(const mesh of [...parent.children]){if(!mesh.isMesh)continue;mesh.updateMatrix();const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrix),key=mesh.material.uuid;if(!buckets.has(key))buckets.set(key,{material:mesh.material,positions:[],normals:[],uvs:[],indices:[],count:0});const data=buckets.get(key),p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv;for(const value of p.array)data.positions.push(value);for(const value of n.array)data.normals.push(value);for(let i=0;i<p.count;i++)data.uvs.push(uv?uv.getX(i):0,uv?uv.getY(i):0);const indices=geometry.index?geometry.index.array:Array.from({length:p.count},(_,i)=>i);for(const index of indices)data.indices.push(index+data.count);data.count+=p.count;geometry.dispose();mesh.geometry.dispose();parent.remove(mesh);}
 for(const data of buckets.values()){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(data.normals,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(data.uvs,2));geometry.setIndex(data.indices);geometry.computeBoundingSphere();parent.add(new T.Mesh(geometry,data.material));}
}
[building,trusses,membrane].forEach(batchMeshes);
mount.dataset.trussMaterial='wood';mount.dataset.houseDesign='michael-september-2023';mount.dataset.ready='true';
const glow=new T.Mesh(new T.RingGeometry(3.95,3.97,100),new T.MeshBasicMaterial({color:0x4e9dd4,transparent:true,opacity:.23,side:T.DoubleSide}));glow.rotation.x=-Math.PI/2;glow.position.y=-.27;glow.scale.y=.76;glow.visible=false;group.add(glow);
// Keep the upright house and lifted roof layers in frame across the limited horizontal turn.
const fittingBounds=[];group.traverse(mesh=>{if(!mesh.isMesh||mesh===glow||mesh===groundPlane)return;mesh.geometry.computeBoundingBox();const {min,max}=mesh.geometry.boundingBox,points=[];for(const x of [min.x,max.x])for(const y of [min.y,max.y])for(const z of [min.z,max.z])points.push(new T.Vector3(x,y,z));fittingBounds.push({mesh,points});});
const viewRight=new T.Vector3().crossVectors(new T.Vector3(0,1,0),viewDirection).normalize(),viewUp=new T.Vector3().crossVectors(viewDirection,viewRight),fitPoint=new T.Vector3();
function fitCamera(){
 orbitRoot.updateMatrixWorld(true);const vertical=Math.tan(camera.fov*Math.PI/360)*.93,horizontal=vertical*camera.aspect;let distance=Math.max(15.5,16.4/Math.max(camera.aspect,.6));
 for(const {mesh,points} of fittingBounds)for(const point of points){fitPoint.copy(point).applyMatrix4(mesh.matrixWorld).sub(viewTarget);const depth=fitPoint.dot(viewDirection);distance=Math.max(distance,depth+Math.abs(fitPoint.dot(viewRight))/horizontal,depth+Math.abs(fitPoint.dot(viewUp))/vertical);}
 camera.position.copy(viewDirection).multiplyScalar(distance).add(viewTarget);camera.lookAt(viewTarget);
}

// Additive marketing layers. Approved architectural vertices are not modified.
const clamp01=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{const t=clamp01(v);return t*t*(3-2*t)};
const coneSections=[{x:-3.35,z:-1.06,r:.69,eave:3.83,rise:.48},{x:1.38,z:-.62,r:.98,eave:3.76,rise:.53}];
function roofAt(x,z){let y=-Infinity;for(const r of hipSections){if(Math.abs(x-r.cx)>r.width/2||Math.abs(z-r.cz)>r.depth/2)continue;const u=r.alongX?x-r.cx:z-r.cz,v=r.alongX?z-r.cz:x-r.cx,L=r.alongX?r.width:r.depth,S=r.alongX?r.depth:r.width,along=u<r.ridgeLow?(u+L/2)/(r.ridgeLow+L/2):u>r.ridgeHigh?(L/2-u)/(L/2-r.ridgeHigh):1;y=Math.max(y,r.eave+r.rise*Math.max(0,Math.min(along,1-Math.abs(v)/(S/2))));}for(const c of coneSections){const d=Math.hypot(x-c.x,z-c.z);if(d<=c.r)y=Math.max(y,c.eave+c.rise*(1-d/c.r));}return y;}
const damaged=[{x:-1.85,z:.25,rx:.43,rz:.33},{x:-.25,z:1.0,rx:.24,rz:.22},{x:2.1,z:1.96,rx:.44,rz:.27},{x:4.3,z:.53,rx:.30,rz:.24}];
const damageAt=(x,z)=>damaged.some(d=>((x-d.x)/d.rx)**2+((z-d.z)/d.rz)**2<1);
const tiles=new T.Group();tiles.name='Terracotta tile roof';group.add(tiles);
const deckMaterial=mat(0x493c35,.98,0),tileMaterials=[0xb96941,0xc3794b,0xac5937,0xcc8452].map(c=>mat(c,.9,0));
for(const mesh of membrane.children.filter(o=>o.isMesh)){const deck=new T.Mesh(mesh.geometry.clone(),deckMaterial);deck.position.y=.008;tiles.add(deck);}
const tileBuckets=tileMaterials.map(()=>[]);let tileCount=0,missingCount=0;
function addTile(x,z,hash){const w=.155,d=.235,center=roofAt(x,z);if(!Number.isFinite(center))return;const corners=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]];if(corners.some(([a,b])=>!Number.isFinite(roofAt(x+a,z+b))||Math.abs(roofAt(x+a,z+b)-center)>.25))return;if(damageAt(x,z)){missingCount++;return;}const arr=tileBuckets[hash%4];for(let i=0;i<5;i++){const a=-w/2+w*i/5,b=-w/2+w*(i+1)/5;const p=(u,v)=>[x+u,roofAt(x+u,z+v)+.019+Math.cos(u/w*Math.PI)*.024+(v>0?.006:0),z+v];const A=p(a,-d/2),B=p(b,-d/2),C=p(b,d/2),D=p(a,d/2);for(const q of [A,C,B,A,D,C])arr.push(...q);}tileCount++;}
for(let ix=0;ix<59;ix++)for(let iz=0;iz<23;iz++)addTile(-4.3+ix*.162,-2.20+iz*.244,(ix*71+iz*37)%997);
for(let i=0;i<tileBuckets.length;i++){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(tileBuckets[i],3));g.computeVertexNormals();tiles.add(new T.Mesh(g,tileMaterials[i]));}
const damageMaterial=mat(0x18272c,.98,0,{side:T.DoubleSide});
for(const d of damaged){const positions=[];for(let i=0;i<20;i++){const point=a=>{const x=d.x+Math.cos(a)*d.rx,z=d.z+Math.sin(a)*d.rz;return [x,roofAt(x,z)+.012,z]};const center=[d.x,roofAt(d.x,d.z)+.012,d.z];positions.push(...center,...point(i*Math.PI/10),...point((i+1)*Math.PI/10));}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();tiles.add(new T.Mesh(g,damageMaterial));}
batchMeshes(tiles);
// CPU morph runs only on scrubbing, not on idle animation frames.
const coverOriginals=membrane.children.filter(o=>o.isMesh||o.isLineSegments).map(mesh=>({mesh,positions:mesh.geometry.attributes.position.array.slice(),normals:mesh.geometry.attributes.normal?.array.slice()}));
let lastMorph=-1;
function morphCover(t){if(Math.abs(t-lastMorph)<.00001)return;lastMorph=t;for(const data of coverOriginals){const p=data.mesh.geometry.attributes.position,n=data.mesh.geometry.attributes.normal;for(let i=0;i<p.count;i++){p.array[i*3+1]=4.50+(data.positions[i*3+1]-4.50)*t;if(n&&data.normals){const x=data.normals[i*3]*t,y=1+(data.normals[i*3+1]-1)*t,z=data.normals[i*3+2]*t,len=Math.hypot(x,y,z)||1;n.array[i*3]=x/len;n.array[i*3+1]=y/len;n.array[i*3+2]=z/len;}}p.needsUpdate=true;if(n)n.needsUpdate=true;data.mesh.geometry.computeBoundingSphere();}}
const flatMaterial=mat(0xeeeeea,.88,0,{side:T.DoubleSide,transparent:true,opacity:1});
const flatGeometry=new T.PlaneGeometry(9.8,5.2,20,12);flatGeometry.rotateX(-Math.PI/2);const flatPos=flatGeometry.attributes.position;for(let i=0;i<flatPos.count;i++)flatPos.setY(i,.018*Math.sin(flatPos.getX(i)*1.5)*Math.cos(flatPos.getZ(i)*1.8));flatGeometry.computeVertexNormals();const flatSheet=new T.Mesh(flatGeometry,flatMaterial);flatSheet.name='Overhead Titanium sheet';group.add(flatSheet);wrap.transparent=true;
let coverProgress=0,weatherTime=0;
const slider=$('#cover-progress');
const phases=[['Damaged tile roof','Missing and broken barrel tiles reveal illustrative rain-entry paths.'],['Position the covering','The Titanium covering slides from right to left above the roof.'],['Lower and conform','The covering settles onto the existing tiled roof contours.'],['Secure the covering','Illustrative interior leak paths fade out while rain is shown running off the covering.']];
function poseAt(value){const p=clamp01(value),travel=smooth(p/.45),lower=smooth((p-.45)/.35),secured=smooth((p-.80)/.20);return {p,x:10.8*(1-travel),lift:1.3+(.07-1.3)*lower,conform:lower,secured,leak:1-smooth((p-.8)/.18),phase:p===0?0:p<=.45?1:p<=.8?2:3};}
let currentPose=poseAt(0);
function reflectProgress(announce=false){currentPose=poseAt(coverProgress);let [title,description]=phases[currentPose.phase];if(coverProgress>=.98)title='Secured covering';$('#cover-phase').textContent=title;$('#cover-description').textContent=description;$('#cover-percentage').textContent=Math.round(coverProgress*100)+'%';slider.setAttribute('aria-valuetext',Math.round(coverProgress*100)+' percent. '+title);$('#model-label').textContent=exploded?'Exploded roof inspection':title;document.querySelectorAll('[data-stage]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.stage)===[0,45,66,100][currentPose.phase])));if(announce)$('#cover-status').textContent=title+'. '+description;}
const effects=new T.Group();effects.name='Illustrative rain and runoff';group.add(effects);
const rainCount=180,rainPositions=new Float32Array(rainCount*6),rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(rainPositions,3));const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:0x75b9e0,transparent:true,opacity:.32}));rain.name='Outdoor rain';effects.add(rain);
const leakCount=48,leakPositions=new Float32Array(leakCount*6),leakGeo=new T.BufferGeometry();leakGeo.setAttribute('position',new T.BufferAttribute(leakPositions,3));const leakMat=new T.LineBasicMaterial({color:0x38b9ff,transparent:true,opacity:.8,depthTest:false});const leaks=new T.LineSegments(leakGeo,leakMat);leaks.name='Illustrative interior leak paths';leaks.renderOrder=5;effects.add(leaks);
const runoffPositions=[];for(const [x,z,dx,dz] of [[-2.7,.84,0,.45],[-1.55,.84,0,.45],[1.0,2.48,0,.4],[2.5,2.48,0,.4],[4.9,.35,.4,0]]){const y=roofAt(x,z);if(Number.isFinite(y)){runoffPositions.push(x,y+.09,z,x+dx,y-.06,z+dz,x+dx,y-.06,z+dz,x+dx,y-.5,z+dz+.06);}}
const runoffGeo=new T.BufferGeometry();runoffGeo.setAttribute('position',new T.Float32BufferAttribute(runoffPositions,3));const runoffMat=new T.LineBasicMaterial({color:0x54c9ef,transparent:true,opacity:.0});const runoff=new T.LineSegments(runoffGeo,runoffMat);runoff.name='Illustrative diverted runoff';effects.add(runoff);
const secureMarkers=new T.Group();secureMarkers.name='Illustrative secured-edge markers';group.add(secureMarkers);const secureMaterial=mat(0x29b7a0,.6,0,{transparent:true,opacity:0});for(const [x,z] of [[-3.65,.85],[-1.15,1.30],[.36,2.42],[3.24,2.42],[5.18,.75]]){const y=roofAt(x,z);if(Number.isFinite(y))box(.10,.045,.10,secureMaterial,x,y-.025,z,secureMarkers);}
function updateWeather(dt){weatherTime+=dt;for(let i=0;i<rainCount;i++){const x=-5.8+((i*73)%997)/997*11.6,z=-3+((i*113)%991)/991*6.5,roof=roofAt(x,z),floor=Number.isFinite(roof)?roof+.12:.0,y=floor+(7.4-floor)*(1-((i*.618+weatherTime*.55)%1)),j=i*6;rainPositions.set([x,y,z,x+.025,Math.max(floor,y-.18),z],j);}rainGeo.attributes.position.needsUpdate=true;for(let i=0;i<leakCount;i++){const d=damaged[i%damaged.length],x=d.x+Math.sin(i*1.7)*d.rx*.55,z=d.z+Math.cos(i*2.1)*d.rz*.55,top=roofAt(x,z),y=.25+(top-.25)*(1-((i*.73+weatherTime*.7)%1)),j=i*6;leakPositions.set([x,y,z,x,y-.16,z],j);}leakGeo.attributes.position.needsUpdate=true;}
updateWeather(0);
const baseFitCamera=fitCamera;
fitCamera=function(){const x=membrane.position.x,y=membrane.position.y;membrane.position.x=0;membrane.position.y=(exploded||explodeAmount>.001)?Math.max(y,2.2):1.55;baseFitCamera();membrane.position.x=x;membrane.position.y=y;orbitRoot.updateMatrixWorld(true);};
mount.dataset.tileCount=String(tileCount);mount.dataset.missingTileCount=String(missingCount);

const DEFAULT_YAW=.22,YAW_LIMIT=Math.PI/6,YAW_STEP=Math.PI/18;
const clampYaw=a=>Math.max(DEFAULT_YAW-YAW_LIMIT,Math.min(DEFAULT_YAW+YAW_LIMIT,a));
let targetAngle=DEFAULT_YAW,dragging=false,pointerActive=false,activePointerId=null,startX=0,startY=0,startAngle=0,lastTime=0,explodeAmount=0,autoAngle=0,autoPhase=0;
function size(){if(!modelAvailable)return;const r=mount.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();fitCamera();draw()}
function draw(){if(modelAvailable)renderer.render(scene,camera)}
function apply(){const yaw=clampYaw(targetAngle+autoAngle);orbitRoot.rotation.set(0,yaw,0,'YXZ');const inspecting=exploded||explodeAmount>.001;tiles.visible=!inspecting&&coverProgress<.98;trusses.position.y=explodeAmount*.3;trusses.visible=inspecting&&explodeAmount>.001;if(inspecting){morphCover(1);membrane.position.set(0,explodeAmount*2.2,0);membrane.visible=true;wrap.opacity=1;flatSheet.visible=false;}else{morphCover(Math.max(.03,currentPose.conform));membrane.position.set(currentPose.x,currentPose.lift,0);membrane.visible=currentPose.conform>.001;wrap.opacity=smooth(currentPose.conform/.18);flatSheet.position.set(currentPose.x+.55,4.50+currentPose.lift,-.05);flatSheet.visible=coverProgress>.005&&currentPose.conform<.18;flatMaterial.opacity=1-smooth(currentPose.conform/.18);}
 effects.visible=storm&&!inspecting;leaks.visible=storm&&!inspecting&&currentPose.leak>.001;leakMat.opacity=.8*currentPose.leak;runoff.visible=storm&&!inspecting&&currentPose.secured>.001;runoffMat.opacity=.85*currentPose.secured;secureMarkers.visible=!inspecting&&currentPose.secured>.001;secureMaterial.opacity=currentPose.secured;
 mount.dataset.rotationYaw=yaw.toFixed(3);mount.dataset.rotationTilt='0.000';mount.dataset.coverProgress=coverProgress.toFixed(3);mount.dataset.coverX=membrane.position.x.toFixed(3);mount.dataset.coverLift=membrane.position.y.toFixed(3);mount.dataset.coverConform=lastMorph.toFixed(3);mount.dataset.leakIntensity=inspecting?'0.000':currentPose.leak.toFixed(3);mount.dataset.mode=inspecting?'exploded':'cover-sequence';if(modelAvailable)fitCamera();draw();}
function animate(now=0){frame=null;if(!modelAvailable||!visible||document.hidden)return;const dt=Math.min((now-lastTime)/1000||0,.04);lastTime=now;if(!paused&&!dragging){autoPhase+=dt*.18;autoAngle=Math.sin(autoPhase)*.055}const target=exploded?1:0;if(paused||motionQuery.matches)explodeAmount=target;else explodeAmount+=(target-explodeAmount)*.065;if(storm&&!paused)updateWeather(dt);apply();if(!paused||Math.abs(explodeAmount-target)>.001)frame=requestAnimationFrame(animate)}
function schedule(){if(!modelAvailable)return;if(frame===null||frame===undefined){lastTime=performance.now();frame=requestAnimationFrame(animate)}}
function manual(){targetAngle=clampYaw(targetAngle+autoAngle);autoAngle=0;autoPhase=0;paused=true;reflectMotion();}
function resetView(){targetAngle=DEFAULT_YAW;autoAngle=0;autoPhase=0;orbitRoot.position.y=1.5;apply();}
function setProgress(value,announce=false){if(!modelAvailable)return;coverProgress=clamp01(Number(value)/100||0);slider.value=String(Math.round(coverProgress*100));exploded=false;explodeAmount=0;$('#assembly').setAttribute('aria-pressed','false');reflectProgress(announce);apply();}
slider.addEventListener('input',e=>setProgress(e.target.value));slider.addEventListener('change',()=>reflectProgress(true));
document.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>setProgress(button.dataset.stage,true)));
mount.addEventListener('pointerdown',e=>{if((e.pointerType==='mouse'&&e.button!==0)||e.isPrimary===false||activePointerId!==null)return;activePointerId=e.pointerId;pointerActive=true;dragging=false;startX=e.clientX;startY=e.clientY;});
mount.addEventListener('pointermove',e=>{if(!pointerActive||e.pointerId!==activePointerId)return;const dx=e.clientX-startX,dy=e.clientY-startY;if(!dragging){if(Math.abs(dx)<6||Math.abs(dx)<=Math.abs(dy))return;manual();dragging=true;startAngle=targetAngle;mount.setPointerCapture(e.pointerId)}targetAngle=clampYaw(startAngle+dx*.006);apply()});
mount.addEventListener('pointerleave',e=>{if(e.pointerId===activePointerId&&!dragging){pointerActive=false;activePointerId=null}});
['pointerup','pointercancel','lostpointercapture'].forEach(type=>mount.addEventListener(type,e=>{if(e.pointerId!==activePointerId||(type==='lostpointercapture'&&e.target!==mount))return;pointerActive=false;activePointerId=null;dragging=false;schedule()}));
mount.addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','Home'].includes(e.key)){e.preventDefault();manual();if(e.key==='Home'){resetView();return;}targetAngle=clampYaw(targetAngle+(e.key==='ArrowRight'?1:-1)*Math.PI/36);apply();}});
$('#rotate-left').addEventListener('click',()=>{manual();targetAngle=clampYaw(targetAngle-YAW_STEP);apply()});$('#rotate').addEventListener('click',()=>{manual();targetAngle=clampYaw(targetAngle+YAW_STEP);apply()});$('#reset-view').addEventListener('click',()=>{manual();resetView()});
$('#assembly').addEventListener('click',()=>{exploded=!exploded;$('#assembly').setAttribute('aria-pressed',String(exploded));reflectProgress();$('#cover-status').textContent=exploded?'Exploded inspection. Scrub the slider to return to the covering sequence.':'Covering sequence restored.';if(paused){explodeAmount=exploded?1:0;apply()}else schedule()});
$('#weather').addEventListener('click',()=>{storm=!storm;$('#weather').setAttribute('aria-pressed',String(storm));$('.roof-demo').classList.toggle('storm',storm);apply();schedule()});
motionBtn.addEventListener('click',()=>{paused=!paused;reflectMotion();schedule()});motionQuery.addEventListener('change',e=>{paused=e.matches;reflectMotion();schedule()});
new ResizeObserver(size).observe(mount);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else if(frame){cancelAnimationFrame(frame);frame=null}},{rootMargin:'100px'}).observe(mount);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);frame=null}else schedule()});renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();showModelFallback()});
reflectProgress();$('.roof-demo').classList.toggle('storm',storm);size();schedule();

} catch(error){console.error(error);showModelFallback()}
})();
