// ============================================================
// SmartFarm v2 — Data Layer (localStorage)
// ============================================================
const SF = {

  get(k)    { try{return JSON.parse(localStorage.getItem('sf_'+k))||[];}catch{return[];} },
  getObj(k,d={}){ try{return JSON.parse(localStorage.getItem('sf_'+k))||d;}catch{return d;} },
  set(k,v)  { localStorage.setItem('sf_'+k, JSON.stringify(v)); },
  nextId(k) { const a=this.get(k); return a.length?Math.max(...a.map(i=>i.id))+1:1; },

  // AUTH
  login(email,password){
    const u=this.get('users').find(u=>u.email===email);
    if(!u) return{ok:false,msg:'Email not found.'};
    if(u.password!==btoa(password)) return{ok:false,msg:'Wrong password.'};
    this.set('session',{id:u.id,name:u.name,email:u.email,role:u.role,farm:u.farmName||'My Farm'});
    return{ok:true};
  },
  logout(){ localStorage.removeItem('sf_session'); window.location.href='login.html'; },
  session(){ return this.getObj('session',null); },
  requireLogin(){ if(!this.session()) window.location.href='login.html'; },
  register(name,email,password,farmName){
    const users=this.get('users');
    if(users.find(u=>u.email===email)) return{ok:false,msg:'Email already registered.'};
    const u={id:this.nextId('users'),name,email,password:btoa(password),role:'farmer',farmName,createdAt:new Date().toISOString()};
    users.push(u); this.set('users',users); return{ok:true};
  },

  // ANIMALS
  getAnimals(){ const s=this.session();if(!s)return[]; return this.get('animals').filter(a=>a.userId===s.id); },
  getAnimal(id){ return this.get('animals').find(a=>a.id===+id); },
  saveAnimal(d){
    const s=this.session();if(!s)return;
    const list=this.get('animals');
    if(d.id){ const i=list.findIndex(a=>a.id===d.id); if(i>-1)list[i]={...list[i],...d}; }
    else{ d.id=this.nextId('animals');d.userId=s.id;d.createdAt=new Date().toISOString();list.push(d); }
    this.set('animals',list); return d.id;
  },

  // LOGS
  getAnimalLogs(aid){ return this.get('animalLogs').filter(l=>l.animalId===+aid); },
  addAnimalLog(log){
    const list=this.get('animalLogs');
    log.id=this.nextId('animalLogs');log.createdAt=new Date().toISOString();list.push(log);
    this.set('animalLogs',list);
    if(log.weight){ const a=this.getAnimal(log.animalId);if(a){a.weight=log.weight;this.saveAnimal(a);} }
  },

  // HEALTH RECORDS
  getHealthRecords(aid){ return this.get('healthRecords').filter(h=>h.animalId===+aid); },
  addHealthRecord(rec){
    const list=this.get('healthRecords');
    rec.id=this.nextId('healthRecords');rec.createdAt=new Date().toISOString();list.push(rec);
    this.set('healthRecords',list);
  },
  getUpcomingHealth(){
    const s=this.session();if(!s)return[];
    const ids=this.getAnimals().map(a=>a.id);
    const today=new Date();today.setHours(0,0,0,0);
    return this.get('healthRecords').filter(h=>ids.includes(h.animalId)&&h.nextDue&&new Date(h.nextDue)>=today)
      .sort((a,b)=>new Date(a.nextDue)-new Date(b.nextDue)).slice(0,6);
  },

  // PLOTS
  getPlots(){ const s=this.session();if(!s)return[]; return this.get('plots').filter(p=>p.userId===s.id); },
  getPlot(id){ return this.get('plots').find(p=>p.id===+id); },
  savePlot(d){
    const s=this.session();if(!s)return;
    const list=this.get('plots');
    if(d.id){ const i=list.findIndex(p=>p.id===d.id); if(i>-1)list[i]={...list[i],...d}; }
    else{ d.id=this.nextId('plots');d.userId=s.id;d.createdAt=new Date().toISOString();list.push(d); }
    this.set('plots',list); return d.id;
  },

  // CROP INPUTS & HARVESTS
  getCropInputs(pid){ return this.get('cropInputs').filter(i=>i.plotId===+pid); },
  addCropInput(inp){
    const list=this.get('cropInputs');
    inp.id=this.nextId('cropInputs');inp.createdAt=new Date().toISOString();list.push(inp);
    this.set('cropInputs',list);
    if(inp.cost>0) this.addTransaction({type:'expense',category:'Crop Input',amount:inp.cost,description:inp.productName,date:inp.dateApplied});
  },
  getHarvests(pid){ return this.get('harvests').filter(h=>h.plotId===+pid); },
  addHarvest(h){
    const list=this.get('harvests');
    h.id=this.nextId('harvests');h.totalRevenue=(h.quantityKg||0)*(h.pricePerKg||0);h.createdAt=new Date().toISOString();list.push(h);
    this.set('harvests',list);
    if(h.totalRevenue>0) this.addTransaction({type:'income',category:'Harvest Sale',amount:h.totalRevenue,description:'Harvest sale',date:h.harvestDate});
  },

  // TRANSACTIONS
  getTransactions(){ const s=this.session();if(!s)return[]; return this.get('transactions').filter(t=>t.userId===s.id); },
  addTransaction(d){
    const s=this.session();if(!s)return;
    const list=this.get('transactions');
    d.id=this.nextId('transactions');d.userId=s.id;d.createdAt=new Date().toISOString();list.push(d);
    this.set('transactions',list);
  },

  // MODULES
  getModules(){
    const d=[{slug:'livestock',name:'Livestock',active:true},{slug:'crops',name:'Crops',active:true},{slug:'executive',name:'Executive',active:true}];
    return this.getObj('modules',{list:d}).list;
  },
  isModuleActive(slug){ return this.getModules().find(m=>m.slug===slug)?.active!==false; },
  toggleModule(slug){ const m=this.getModules(); const f=m.find(x=>x.slug===slug); if(f)f.active=!f.active; this.set('modules',{list:m}); },

  // UTILITIES
  currency(n){ return '₦'+Number(n||0).toLocaleString('en-NG',{minimumFractionDigits:2}); },
  fmtDate(d){ return d?new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'—'; },
  fmtDateShort(d){ return d?new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'—'; },
  animalIcon(t){ return {cow:'🐄',goat:'🐐',poultry:'🐔',sheep:'🐑',pig:'🐷',other:'🐾'}[t]||'🐾'; },
  progress(s,e){ if(!s||!e)return 0; const ss=new Date(s),ee=new Date(e),n=new Date(); if(n>=ee)return 100; if(n<=ss)return 0; return Math.round((n-ss)/(ee-ss)*100); },
  daysUntil(d){ const dd=new Date(d);dd.setHours(0,0,0,0);const t=new Date();t.setHours(0,0,0,0);return Math.round((dd-t)/86400000); },
  healthChip(s){ const m={healthy:'chip-ok',sick:'chip-bad',recovering:'chip-warn',deceased:'chip-bad'}; return `<span class="chip ${m[s]||'chip-gray'}">${s}</span>`; },
  param(k){ return new URLSearchParams(window.location.search).get(k); },
  toast(msg,type='success'){
    const c={success:var('--green'),error:'#a83030',warning:'#b87418',info:'#1a60a8'};
    const el=document.createElement('div');
    el.style.cssText=`position:fixed;bottom:20px;right:20px;background:${type==='success'?'#2d7a3a':type==='error'?'#a83030':type==='warning'?'#b87418':'#1a60a8'};color:#fff;padding:11px 18px;border-radius:10px;font-size:12px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.2);animation:fadeIn .3s ease;font-family:var(--font)`;
    el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3200);
  },

  // DEMO SEED
  seedIfEmpty(){
    if(this.get('users').length) return;
    this.set('users',[{id:1,name:'Farm Admin',email:'admin@smartfarm.com',password:btoa('password'),role:'admin',farmName:'SmartFarm Nigeria',createdAt:new Date().toISOString()}]);
    this.set('animals',[
      {id:1,userId:1,tagId:'COW-001',name:'Bessie',type:'cow',breed:'Friesian',gender:'female',dob:'2021-03-15',weight:480,color:'Black & White',source:'Purchased',purchasePrice:150000,currentValue:220000,healthStatus:'sick',reproductiveStatus:'Lactating',notes:'High fever — vet dispatched',isActive:true,createdAt:'2024-01-10T00:00:00Z'},
      {id:2,userId:1,tagId:'COW-002',name:'Daisy',type:'cow',breed:'Friesian',gender:'female',dob:'2019-06-20',weight:510,color:'Brown',source:'Purchased',purchasePrice:180000,currentValue:260000,healthStatus:'healthy',reproductiveStatus:'Lactating',notes:'',isActive:true,createdAt:'2024-01-15T00:00:00Z'},
      {id:3,userId:1,tagId:'COW-003',name:'Rose',type:'cow',breed:'Hereford',gender:'female',dob:'2022-09-01',weight:310,color:'Red & White',source:'Born here',purchasePrice:0,currentValue:140000,healthStatus:'healthy',reproductiveStatus:'Pregnant',notes:'Due in ~22 days',isActive:true,createdAt:'2024-02-01T00:00:00Z'},
      {id:4,userId:1,tagId:'PIG-001',name:'Grunt',type:'pig',breed:'Duroc',gender:'male',dob:'2023-11-01',weight:58,color:'Red-Brown',source:'Purchased',purchasePrice:25000,currentValue:30000,healthStatus:'recovering',reproductiveStatus:'None',notes:'17kg below target — increase ration',isActive:true,createdAt:'2024-03-01T00:00:00Z'},
      {id:5,userId:1,tagId:'PKT-001',name:'Pen A (30 birds)',type:'poultry',breed:'Broiler',gender:'female',dob:'2024-09-01',weight:1.9,color:'White',source:'Purchased',purchasePrice:90000,currentValue:150000,healthStatus:'healthy',reproductiveStatus:'Laying',notes:'Week 6 — on track',isActive:true,createdAt:'2024-09-01T00:00:00Z'},
      {id:6,userId:1,tagId:'PIG-002',name:'Mama',type:'pig',breed:'Large White',gender:'female',dob:'2022-05-10',weight:160,color:'Pink-White',source:'Purchased',purchasePrice:60000,currentValue:80000,healthStatus:'healthy',reproductiveStatus:'Nursing',notes:'8 piglets — all nursing well',isActive:true,createdAt:'2023-01-10T00:00:00Z'},
    ]);
    this.set('animalLogs',[
      {id:1,animalId:1,logDate:'2024-12-01',weight:478,milkYield:0,feedIntake:12,temperature:39.8,notes:'Fever detected',createdAt:'2024-12-01T00:00:00Z'},
      {id:2,animalId:2,logDate:'2024-12-01',weight:511,milkYield:18.5,feedIntake:12,temperature:38.4,notes:'Normal',createdAt:'2024-12-01T00:00:00Z'},
      {id:3,animalId:2,logDate:'2024-12-02',weight:511,milkYield:19,feedIntake:12,temperature:38.3,notes:'',createdAt:'2024-12-02T00:00:00Z'},
    ]);
    this.set('healthRecords',[
      {id:1,animalId:1,recordType:'treatment',vaccineName:'Antipyretic injection',vetName:'Dr. Emeka',dateGiven:'2024-12-01',nextDue:'2024-12-08',cost:8500,notes:'Fever 39.8°C',createdAt:'2024-12-01T00:00:00Z'},
      {id:2,animalId:2,recordType:'vaccination',vaccineName:'FMD Booster',vetName:'Dr. Emeka',dateGiven:'2024-11-01',nextDue:'2025-05-01',cost:5000,notes:'',createdAt:'2024-11-01T00:00:00Z'},
      {id:3,animalId:5,recordType:'vaccination',vaccineName:'Newcastle Disease',vetName:'Farm Staff',dateGiven:'2024-11-15',nextDue:'2025-04-15',cost:3500,notes:'All pen vaccinated',createdAt:'2024-11-15T00:00:00Z'},
    ]);
    this.set('plots',[
      {id:1,userId:1,name:'North Field A',sizeHectare:3.5,cropType:'Maize',plantingDate:'2024-10-01',expectedHarvest:'2025-01-15',status:'growing',soilType:'Loamy',irrigationType:'Rain-fed',notes:'',createdAt:'2024-10-01T00:00:00Z'},
      {id:2,userId:1,name:'South Plot B',sizeHectare:2.0,cropType:'Cassava',plantingDate:'2024-08-15',expectedHarvest:'2025-08-15',status:'growing',soilType:'Sandy loam',irrigationType:'Drip',notes:'',createdAt:'2024-08-15T00:00:00Z'},
    ]);
    this.set('cropInputs',[
      {id:1,plotId:1,inputType:'fertilizer',productName:'NPK 15-15-15',quantity:50,unit:'kg',cost:35000,dateApplied:'2024-10-15',notes:'',createdAt:'2024-10-15T00:00:00Z'},
      {id:2,plotId:1,inputType:'pesticide',productName:'Cypermethrin',quantity:2,unit:'L',cost:8000,dateApplied:'2024-11-01',notes:'',createdAt:'2024-11-01T00:00:00Z'},
      {id:3,plotId:2,inputType:'fertilizer',productName:'Urea',quantity:30,unit:'kg',cost:22000,dateApplied:'2024-09-01',notes:'',createdAt:'2024-09-01T00:00:00Z'},
    ]);
    this.set('harvests',[
      {id:1,plotId:2,quantityKg:800,pricePerKg:120,totalRevenue:96000,harvestDate:'2024-11-20',buyerName:'Market A',notes:'First batch',createdAt:'2024-11-20T00:00:00Z'},
    ]);
    this.set('transactions',[
      {id:1,userId:1,type:'income',category:'Milk Sale',amount:45000,description:'Weekly milk sales',date:'2024-12-01',createdAt:'2024-12-01T00:00:00Z'},
      {id:2,userId:1,type:'expense',category:'Feed',amount:28000,description:'Cattle hay purchase',date:'2024-12-01',createdAt:'2024-12-01T00:00:00Z'},
      {id:3,userId:1,type:'income',category:'Egg Sale',amount:18000,description:'Poultry egg sales',date:'2024-11-28',createdAt:'2024-11-28T00:00:00Z'},
      {id:4,userId:1,type:'expense',category:'Veterinary',amount:8500,description:'Vet visit + medication',date:'2024-11-25',createdAt:'2024-11-25T00:00:00Z'},
      {id:5,userId:1,type:'income',category:'Harvest Sale',amount:96000,description:'Cassava harvest sale',date:'2024-11-20',createdAt:'2024-11-20T00:00:00Z'},
      {id:6,userId:1,type:'expense',category:'Crop Input',amount:65000,description:'Fertilizer & pesticide',date:'2024-10-15',createdAt:'2024-10-15T00:00:00Z'},
    ]);
  },
};

function var_(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

// Inject style animation
const _s=document.createElement('style');
_s.textContent=`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}`;
document.head.appendChild(_s);

SF.seedIfEmpty();
