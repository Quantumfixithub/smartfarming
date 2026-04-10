// ============================================================
// SmartFarm — Core App (localStorage "database")
// ============================================================

const SF = {

  // ── Storage helpers ─────────────────────────────────────
  get(key) {
    try { return JSON.parse(localStorage.getItem('sf_' + key)) || []; }
    catch { return []; }
  },
  getObj(key, fallback = {}) {
    try { return JSON.parse(localStorage.getItem('sf_' + key)) || fallback; }
    catch { return fallback; }
  },
  set(key, val) {
    localStorage.setItem('sf_' + key, JSON.stringify(val));
  },
  nextId(key) {
    const items = this.get(key);
    return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
  },

  // ── Auth ─────────────────────────────────────────────────
  login(email, password) {
    const users = this.get('users');
    const user  = users.find(u => u.email === email);
    if (!user) return { ok: false, msg: 'Email not found.' };
    if (user.password !== btoa(password)) return { ok: false, msg: 'Wrong password.' };
    this.set('session', { id: user.id, name: user.name, email: user.email, role: user.role });
    return { ok: true };
  },
  logout() {
    localStorage.removeItem('sf_session');
    window.location.href = 'login.html';
  },
  session() {
    return this.getObj('session', null);
  },
  requireLogin() {
    if (!this.session()) window.location.href = 'login.html';
  },
  register(name, email, password, farmName) {
    const users = this.get('users');
    if (users.find(u => u.email === email)) return { ok: false, msg: 'Email already registered.' };
    const user = { id: this.nextId('users'), name, email, password: btoa(password), role: 'farmer', farmName, createdAt: new Date().toISOString() };
    users.push(user);
    this.set('users', users);
    return { ok: true };
  },

  // ── Animals ──────────────────────────────────────────────
  getAnimals() {
    const s = this.session(); if (!s) return [];
    return this.get('animals').filter(a => a.userId === s.id);
  },
  getAnimal(id) { return this.get('animals').find(a => a.id === +id); },
  saveAnimal(data) {
    const s = this.session(); if (!s) return;
    const list = this.get('animals');
    if (data.id) {
      const i = list.findIndex(a => a.id === data.id);
      if (i > -1) list[i] = { ...list[i], ...data };
    } else {
      data.id = this.nextId('animals');
      data.userId = s.id;
      data.createdAt = new Date().toISOString();
      list.push(data);
    }
    this.set('animals', list);
    return data.id;
  },

  // ── Livestock Logs ───────────────────────────────────────
  getAnimalLogs(animalId) {
    return this.get('animalLogs').filter(l => l.animalId === +animalId);
  },
  addAnimalLog(log) {
    const list = this.get('animalLogs');
    log.id = this.nextId('animalLogs');
    log.createdAt = new Date().toISOString();
    list.push(log);
    this.set('animalLogs', list);
    // Update animal weight
    if (log.weight) {
      const a = this.getAnimal(log.animalId);
      if (a) { a.weight = log.weight; this.saveAnimal(a); }
    }
  },

  // ── Health Records ───────────────────────────────────────
  getHealthRecords(animalId) {
    return this.get('healthRecords').filter(h => h.animalId === +animalId);
  },
  addHealthRecord(rec) {
    const list = this.get('healthRecords');
    rec.id = this.nextId('healthRecords');
    rec.createdAt = new Date().toISOString();
    list.push(rec);
    this.set('healthRecords', list);
  },
  getUpcomingHealth() {
    const s = this.session(); if (!s) return [];
    const myAnimals = this.getAnimals().map(a => a.id);
    const today = new Date(); today.setHours(0,0,0,0);
    return this.get('healthRecords')
      .filter(h => myAnimals.includes(h.animalId) && h.nextDue)
      .filter(h => new Date(h.nextDue) >= today)
      .sort((a,b) => new Date(a.nextDue) - new Date(b.nextDue))
      .slice(0, 5);
  },

  // ── Plots ────────────────────────────────────────────────
  getPlots() {
    const s = this.session(); if (!s) return [];
    return this.get('plots').filter(p => p.userId === s.id);
  },
  getPlot(id) { return this.get('plots').find(p => p.id === +id); },
  savePlot(data) {
    const s = this.session(); if (!s) return;
    const list = this.get('plots');
    if (data.id) {
      const i = list.findIndex(p => p.id === data.id);
      if (i > -1) list[i] = { ...list[i], ...data };
    } else {
      data.id = this.nextId('plots');
      data.userId = s.id;
      data.createdAt = new Date().toISOString();
      list.push(data);
    }
    this.set('plots', list);
    return data.id;
  },

  // ── Crop Inputs ──────────────────────────────────────────
  getCropInputs(plotId) {
    return this.get('cropInputs').filter(i => i.plotId === +plotId);
  },
  addCropInput(inp) {
    const list = this.get('cropInputs');
    inp.id = this.nextId('cropInputs');
    inp.createdAt = new Date().toISOString();
    list.push(inp);
    this.set('cropInputs', list);
    if (inp.cost > 0) this.addTransaction({ type:'expense', category:'Crop Input', amount: inp.cost, description: inp.productName, date: inp.dateApplied });
  },

  // ── Harvests ─────────────────────────────────────────────
  getHarvests(plotId) {
    return this.get('harvests').filter(h => h.plotId === +plotId);
  },
  addHarvest(h) {
    const list = this.get('harvests');
    h.id = this.nextId('harvests');
    h.totalRevenue = (h.quantityKg || 0) * (h.pricePerKg || 0);
    h.createdAt = new Date().toISOString();
    list.push(h);
    this.set('harvests', list);
    if (h.totalRevenue > 0) this.addTransaction({ type:'income', category:'Harvest Sale', amount: h.totalRevenue, description: 'Harvest sale', date: h.harvestDate });
  },

  // ── Transactions ─────────────────────────────────────────
  getTransactions() {
    const s = this.session(); if (!s) return [];
    return this.get('transactions').filter(t => t.userId === s.id);
  },
  addTransaction(data) {
    const s = this.session(); if (!s) return;
    const list = this.get('transactions');
    data.id = this.nextId('transactions');
    data.userId = s.id;
    data.createdAt = new Date().toISOString();
    list.push(data);
    this.set('transactions', list);
  },

  // ── Modules ──────────────────────────────────────────────
  getModules() {
    const defaults = [
      { slug: 'livestock', name: 'Livestock', active: true },
      { slug: 'crops',     name: 'Crops',     active: true },
      { slug: 'executive', name: 'Executive', active: true },
    ];
    return this.getObj('modules', { list: defaults }).list;
  },
  isModuleActive(slug) {
    return this.getModules().find(m => m.slug === slug)?.active !== false;
  },
  toggleModule(slug) {
    const mods = this.getModules();
    const m = mods.find(m => m.slug === slug);
    if (m) m.active = !m.active;
    this.set('modules', { list: mods });
  },

  // ── Utilities ─────────────────────────────────────────────
  currency(n) { return '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 }); },
  fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '—'; },
  animalIcon(type) { return { cow:'🐄', goat:'🐐', poultry:'🐔', sheep:'🐑', pig:'🐷', other:'🐾' }[type] || '🐾'; },
  progress(start, end) {
    if (!start || !end) return 0;
    const s = new Date(start), e = new Date(end), n = new Date();
    if (n >= e) return 100;
    if (n <= s) return 0;
    return Math.round(((n - s) / (e - s)) * 100);
  },
  daysUntil(dateStr) {
    const d = new Date(dateStr); d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return Math.round((d - t) / 86400000);
  },
  toast(msg, type = 'success') {
    const colors = { success:'#16a34a', error:'#dc2626', warning:'#d97706', info:'#2563eb' };
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;bottom:20px;right:20px;background:${colors[type]};color:#fff;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.2);animation:slideUp .3s ease`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  },
  param(key) { return new URLSearchParams(window.location.search).get(key); },

  // ── Seed Demo Data ────────────────────────────────────────
  seedIfEmpty() {
    if (this.get('users').length) return;
    // Create demo admin
    const users = [{ id:1, name:'Farm Admin', email:'admin@smartfarm.com', password: btoa('password'), role:'admin', farmName:'My Smart Farm', createdAt: new Date().toISOString() }];
    this.set('users', users);

    // Demo animals
    const animals = [
      { id:1, userId:1, tagId:'COW-001', name:'Bessie', type:'cow', breed:'Friesian', gender:'female', dob:'2021-03-15', weight:380, color:'Black & White', source:'Purchased', purchasePrice:150000, currentValue:220000, healthStatus:'healthy', reproductiveStatus:'Lactating', notes:'Top milk producer', createdAt:'2024-01-10T00:00:00.000Z' },
      { id:2, userId:1, tagId:'COW-002', name:'Bruno', type:'cow', breed:'Zebu', gender:'male', dob:'2020-06-20', weight:450, color:'Brown', source:'Born here', purchasePrice:0, currentValue:300000, healthStatus:'healthy', reproductiveStatus:'Breeding', notes:'', createdAt:'2024-01-15T00:00:00.000Z' },
      { id:3, userId:1, tagId:'GT-001', name:'Nanny', type:'goat', breed:'Boer', gender:'female', dob:'2022-09-01', weight:45, color:'White', source:'Purchased', purchasePrice:25000, currentValue:40000, healthStatus:'healthy', reproductiveStatus:'Pregnant', notes:'', createdAt:'2024-02-01T00:00:00.000Z' },
      { id:4, userId:1, tagId:'PKT-001', name:'Hen Batch A', type:'poultry', breed:'Broiler', gender:'female', dob:'2024-09-01', weight:2.5, color:'White', source:'Purchased', purchasePrice:80000, currentValue:120000, healthStatus:'healthy', reproductiveStatus:'Laying', notes:'200 birds', createdAt:'2024-09-01T00:00:00.000Z' },
    ];
    this.set('animals', animals);

    // Demo logs
    const logs = [
      { id:1, animalId:1, logDate:'2024-12-01', weight:378, milkYield:18.5, feedIntake:12, temperature:38.4, notes:'Normal day', createdAt:'2024-12-01T00:00:00.000Z' },
      { id:2, animalId:1, logDate:'2024-12-02', weight:379, milkYield:19, feedIntake:12, temperature:38.3, notes:'', createdAt:'2024-12-02T00:00:00.000Z' },
      { id:3, animalId:1, logDate:'2024-12-03', weight:380, milkYield:18, feedIntake:11.5, temperature:38.5, notes:'Slight drop in milk', createdAt:'2024-12-03T00:00:00.000Z' },
    ];
    this.set('animalLogs', logs);

    // Demo health records
    const health = [
      { id:1, animalId:1, recordType:'vaccination', vaccineName:'FMD Vaccine', vetName:'Dr. Adeola', dateGiven:'2024-11-01', nextDue:'2025-05-01', cost:5000, notes:'Routine', createdAt:'2024-11-01T00:00:00.000Z' },
      { id:2, animalId:2, recordType:'deworming', vaccineName:'Albendazole', vetName:'Dr. Adeola', dateGiven:'2024-11-15', nextDue:'2025-02-15', cost:3500, notes:'', createdAt:'2024-11-15T00:00:00.000Z' },
    ];
    this.set('healthRecords', health);

    // Demo plots
    const plots = [
      { id:1, userId:1, name:'North Field A', sizeHectare:3.5, cropType:'Maize', plantingDate:'2024-10-01', expectedHarvest:'2025-01-15', status:'growing', soilType:'Loamy', irrigationType:'Rain-fed', notes:'Good yield expected', createdAt:'2024-10-01T00:00:00.000Z' },
      { id:2, userId:1, name:'South Plot B', sizeHectare:2.0, cropType:'Cassava', plantingDate:'2024-08-15', expectedHarvest:'2025-08-15', status:'growing', soilType:'Sandy loam', irrigationType:'Drip', notes:'', createdAt:'2024-08-15T00:00:00.000Z' },
    ];
    this.set('plots', plots);

    // Demo inputs
    const inputs = [
      { id:1, plotId:1, inputType:'fertilizer', productName:'NPK 15-15-15', quantity:50, unit:'kg', cost:35000, dateApplied:'2024-10-15', notes:'', createdAt:'2024-10-15T00:00:00.000Z' },
      { id:2, plotId:1, inputType:'pesticide', productName:'Cypermethrin', quantity:2, unit:'L', cost:8000, dateApplied:'2024-11-01', notes:'', createdAt:'2024-11-01T00:00:00.000Z' },
      { id:3, plotId:2, inputType:'fertilizer', productName:'Urea', quantity:30, unit:'kg', cost:22000, dateApplied:'2024-09-01', notes:'', createdAt:'2024-09-01T00:00:00.000Z' },
    ];
    this.set('cropInputs', inputs);

    // Demo harvests
    const harvests = [
      { id:1, plotId:2, quantityKg:800, pricePerKg:120, totalRevenue:96000, harvestDate:'2024-11-20', buyerName:'Market A', notes:'First batch', createdAt:'2024-11-20T00:00:00.000Z' },
    ];
    this.set('harvests', harvests);

    // Demo transactions
    const trans = [
      { id:1, userId:1, type:'income',  category:'Milk Sale',   amount:45000,  description:'Weekly milk sale',    date:'2024-12-01', createdAt:'2024-12-01T00:00:00.000Z' },
      { id:2, userId:1, type:'expense', category:'Feed',        amount:28000,  description:'Cattle feed purchase', date:'2024-12-01', createdAt:'2024-12-01T00:00:00.000Z' },
      { id:3, userId:1, type:'income',  category:'Egg Sale',    amount:18000,  description:'Egg sales',            date:'2024-11-28', createdAt:'2024-11-28T00:00:00.000Z' },
      { id:4, userId:1, type:'expense', category:'Veterinary',  amount:8500,   description:'Vet visit + meds',    date:'2024-11-25', createdAt:'2024-11-25T00:00:00.000Z' },
      { id:5, userId:1, type:'income',  category:'Harvest Sale', amount:96000, description:'Harvest sale',        date:'2024-11-20', createdAt:'2024-11-20T00:00:00.000Z' },
      { id:6, userId:1, type:'expense', category:'Crop Input',  amount:65000,  description:'Fertilizer + pesticide', date:'2024-10-15', createdAt:'2024-10-15T00:00:00.000Z' },
    ];
    this.set('transactions', trans);
  },

};

// Add CSS animation for toast
const style = document.createElement('style');
style.textContent = `@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
document.head.appendChild(style);

// Seed demo data on first load
SF.seedIfEmpty();
