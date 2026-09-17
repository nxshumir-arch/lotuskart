require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_KEY = process.env.ADMIN_KEY || 'change-this-admin-key';
const DELIVERY_KEY = process.env.DELIVERY_KEY || 'change-this-delivery-key';
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'uploads', 'products');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'lotuskart.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  area TEXT NOT NULL DEFAULT 'Alipur',
  phone TEXT DEFAULT '',
  available INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  unit TEXT DEFAULT '',
  category TEXT NOT NULL,
  shop_id INTEGER NOT NULL,
  image TEXT DEFAULT '',
  emoji TEXT DEFAULT '🛒',
  available INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(shop_id) REFERENCES shops(id) ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL DEFAULT 'Customer',
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('UPI','COD')),
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  subtotal REAL NOT NULL,
  delivery_fee REAL NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  assigned_to TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  cancelled_at INTEGER,
  delivered_at INTEGER
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT DEFAULT '',
  image TEXT DEFAULT '',
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);
`);

// Backward-compatible migration for databases created by older LotusKart versions.
try { db.exec("ALTER TABLE orders ADD COLUMN delivered_at INTEGER"); } catch (e) {
  if (!String(e.message).includes('duplicate column name')) throw e;
}

const seedShops = [
 ['Sharma General Store','Main Road',''],['Sri Lakshmi Stores','Market Area',''],['New Alipur Mart','Alipur',''],['Alipur Fresh Corner','Bus Stand',''],
 ['Gupta Daily Needs','Station Road',''],['Maa Grocery Point','Temple Road',''],['City Super Store','Main Market',''],['Alipur Provision Store','College Road',''],
 ['Fresh Basket Alipur','Market Area',''],['Family Needs Store','Alipur','']
];
const seedProducts = [
 ['Aashirvaad Atta',245,'5 kg','Staples','Sharma General Store','https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=85','🌾'],
 ['Amul Taaza Milk',32,'500 ml','Dairy','Sri Lakshmi Stores','https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=700&q=85','🥛'],
 ['Fortune Sunflower Oil',145,'1 L','Staples','Sharma General Store','https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=85','🫗'],
 ['Tata Salt',28,'1 kg','Staples','New Alipur Mart','https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=700&q=85','🧂'],
 ['Parle-G Biscuits',10,'79 g','Snacks','Sri Lakshmi Stores','https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=700&q=85','🍪'],
 ['Fresh Bananas',50,'1 dozen','Fruits','Alipur Fresh Corner','https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=700&q=85','🍌'],
 ['Tomatoes',35,'1 kg','Vegetables','Alipur Fresh Corner','https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=700&q=85','🍅'],
 ['Coca-Cola',45,'750 ml','Beverages','New Alipur Mart','https://images.unsplash.com/photo-1629203849820-fdd70d49c38e?auto=format&fit=crop&w=700&q=85','🥤'],
 ['Surf Excel',110,'1 kg','Household','Sharma General Store','https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=700&q=85','🧺'],
 ['Bread',40,'400 g','Bakery','Sri Lakshmi Stores','https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=85','🍞'],
 ['Apples',140,'1 kg','Fruits','Alipur Fresh Corner','https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=700&q=85','🍎'],
 ['Maggi Noodles',14,'70 g','Snacks','New Alipur Mart','https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=700&q=85','🍜']
];
if (db.prepare('SELECT COUNT(*) c FROM shops').get().c === 0) {
  const stmt = db.prepare('INSERT INTO shops(name,area,phone,available,created_at) VALUES(?,?,?,?,?)');
  const tx = db.transaction(rows => rows.forEach(r => stmt.run(...r, 1, Date.now())));
  tx(seedShops);
}
if (db.prepare('SELECT COUNT(*) c FROM products').get().c === 0) {
  const getShop = db.prepare('SELECT id FROM shops WHERE name=?');
  const stmt = db.prepare('INSERT INTO products(name,price,unit,category,shop_id,image,emoji,available,created_at) VALUES(?,?,?,?,?,?,?,?,?)');
  const tx = db.transaction(rows => rows.forEach(r => { const s=getShop.get(r[4]); stmt.run(r[0],r[1],r[2],r[3],s.id,r[5],r[6],1,Date.now()); }));
  tx(seedProducts);
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(ROOT, 'uploads')));
app.use(express.static(ROOT));

function auth(type) {
  return (req,res,next)=>{
    const expected = type === 'admin' ? ADMIN_KEY : DELIVERY_KEY;
    const key = req.get('x-api-key');
    if (!key || key !== expected) return res.status(401).json({error:'Unauthorized'});
    next();
  };
}
function productRow(r){ return {...r, available:!!r.available, shop:r.shop_name}; }
function shopRow(r){ return {...r, available:!!r.available}; }
function orderRow(o){
  const items=db.prepare('SELECT id,product_id,product_name AS name,shop_name AS shop,price,quantity AS qty,unit,image FROM order_items WHERE order_id=? ORDER BY id').all(o.id);
  return {...o, items};
}
function nextOrderCode(){ return '#LK' + String(Date.now()).slice(-7); }
function validStatus(s){ return ['New','Accepted','Picked up','Delivered','Cancelled'].includes(s); }

app.get('/api/health',(req,res)=>res.json({ok:true,service:'LotusKart API',area:'Alipur'}));
app.get('/api/shops',(req,res)=>{
  const rows=db.prepare('SELECT id,name,area,phone,available,created_at FROM shops ORDER BY name').all().map(shopRow); res.json(rows);
});
app.get('/api/products',(req,res)=>{
  const q=String(req.query.q||'').trim().toLowerCase();
  const category=String(req.query.category||'').trim();
  let rows=db.prepare(`SELECT p.*, s.name shop_name, s.area shop_area, s.available shop_available FROM products p JOIN shops s ON s.id=p.shop_id ORDER BY p.id DESC`).all().map(productRow);
  rows=rows.filter(p=>p.available && p.shop_available);
  if(category && category!=='All') rows=rows.filter(p=>p.category===category);
  if(q) rows=rows.filter(p=>`${p.name} ${p.shop} ${p.category}`.toLowerCase().includes(q));
  res.json(rows);
});

app.post('/api/orders',(req,res)=>{
  try {
    const {customerName='Customer',phone,address,paymentMethod,items}=req.body||{};
    if(!address || !/^\d{10}$/.test(String(phone||''))) return res.status(400).json({error:'Valid address and 10-digit phone are required.'});
    if(!['UPI','COD'].includes(paymentMethod)) return res.status(400).json({error:'Payment method must be UPI or COD.'});
    if(!Array.isArray(items)||!items.length) return res.status(400).json({error:'Cart is empty.'});
    const get=db.prepare(`SELECT p.*,s.name shop_name,s.available shop_available FROM products p JOIN shops s ON s.id=p.shop_id WHERE p.id=?`);
    const clean=[]; let subtotal=0;
    for(const raw of items){
      const p=get.get(Number(raw.productId)); const qty=Math.max(1,Math.min(99,Number(raw.quantity)||0));
      if(!p || !p.available || !p.shop_available) return res.status(400).json({error:`Product unavailable: ${p?.name||raw.productId}`});
      clean.push({productId:p.id,name:p.name,shop:p.shop_name,price:p.price,qty,unit:p.unit,image:p.image}); subtotal += p.price*qty;
    }
    const deliveryFee=subtotal>=250?0:25, total=subtotal+deliveryFee, code=nextOrderCode(), now=Date.now();
    const saveOrder=db.transaction(()=>{
      const info=db.prepare(`INSERT INTO orders(order_code,customer_name,phone,address,payment_method,payment_status,subtotal,delivery_fee,total,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(code,customerName||'Customer',String(phone),address,paymentMethod,paymentMethod==='COD'?'Not required':'Pending',subtotal,deliveryFee,total,'New',now);
      const stmt=db.prepare(`INSERT INTO order_items(order_id,product_id,product_name,shop_name,price,quantity,unit,image) VALUES(?,?,?,?,?,?,?,?)`);
      clean.forEach(i=>stmt.run(info.lastInsertRowid,i.productId,i.name,i.shop,i.price,i.qty,i.unit ?? null,i.image ?? null));
      return info.lastInsertRowid;
    });
    const orderId=saveOrder();
    res.status(201).json(orderRow(db.prepare('SELECT * FROM orders WHERE id=?').get(orderId)));
  } catch(e){ console.error(e); res.status(500).json({error:'Could not create order.'}); }
});
app.get('/api/orders/:code',(req,res)=>{
  const o=db.prepare('SELECT * FROM orders WHERE order_code=?').get(req.params.code); if(!o)return res.status(404).json({error:'Order not found'}); res.json(orderRow(o));
});
app.post('/api/orders/:code/cancel',(req,res)=>{
  const o=db.prepare('SELECT * FROM orders WHERE order_code=?').get(req.params.code); if(!o)return res.status(404).json({error:'Order not found'});
  if(Date.now()-o.created_at>60000)return res.status(400).json({error:'The 1-minute cancellation window has expired.'});
  if(o.status!=='New')return res.status(400).json({error:'This order can no longer be cancelled.'});
  db.prepare("UPDATE orders SET status='Cancelled',cancelled_at=? WHERE id=?").run(Date.now(),o.id); res.json(orderRow(db.prepare('SELECT * FROM orders WHERE id=?').get(o.id)));
});

app.get('/api/admin/dashboard',auth('admin'),(req,res)=>{
  const orders=db.prepare('SELECT COUNT(*) c FROM orders').get().c;
  const pending=db.prepare("SELECT COUNT(*) c FROM orders WHERE status NOT IN ('Delivered','Cancelled')").get().c;
  const products=db.prepare('SELECT COUNT(*) c FROM products').get().c;
  const shops=db.prepare('SELECT COUNT(*) c FROM shops').get().c;
  res.json({orders,pending,products,shops});
});
app.get('/api/admin/orders',auth('admin'),(req,res)=>{
  const filter=String(req.query.status||'All');
  const base=filter==='All'?db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all():db.prepare('SELECT * FROM orders WHERE status=? ORDER BY created_at DESC').all(filter);
  res.json(base.map(orderRow));
});
app.patch('/api/admin/orders/:code',auth('admin'),(req,res)=>{
  const o=db.prepare('SELECT * FROM orders WHERE order_code=?').get(req.params.code); if(!o)return res.status(404).json({error:'Order not found'});
  const {status,assignedTo}=req.body||{};
  if(status && !validStatus(status))return res.status(400).json({error:'Invalid status'});
  if(status==='Cancelled' && o.status==='Delivered')return res.status(400).json({error:'Delivered order cannot be cancelled.'});
  db.prepare('UPDATE orders SET status=COALESCE(?,status),assigned_to=COALESCE(?,assigned_to) WHERE id=?').run(status||null,assignedTo??null,o.id);
  res.json(orderRow(db.prepare('SELECT * FROM orders WHERE id=?').get(o.id)));
});
app.get('/api/admin/products',auth('admin'),(req,res)=>{
  res.json(db.prepare(`SELECT p.*,s.name shop_name,s.area shop_area,s.available shop_available FROM products p JOIN shops s ON s.id=p.shop_id ORDER BY p.id DESC`).all().map(productRow));
});

const storage=multer.diskStorage({destination:(req,file,cb)=>cb(null,UPLOAD_DIR),filename:(req,file,cb)=>{
  const ext=path.extname(file.originalname).toLowerCase() || '.jpg'; cb(null,`product-${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
}});
const upload=multer({storage,limits:{fileSize:5*1024*1024},fileFilter:(req,file,cb)=>cb(null,/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype))});

app.post('/api/admin/products',auth('admin'),upload.single('image'),(req,res)=>{
  const {name,price,unit='',category='Staples',shopId,available='true',emoji='🛒'}=req.body;
  const shop=db.prepare('SELECT * FROM shops WHERE id=?').get(Number(shopId));
  if(!name || !Number(price) || !shop)return res.status(400).json({error:'Name, price and valid shop are required.'});
  const image=req.file?`/uploads/products/${req.file.filename}`:(req.body.image||'');
  const info=db.prepare(`INSERT INTO products(name,price,unit,category,shop_id,image,emoji,available,created_at) VALUES(?,?,?,?,?,?,?,?,?)`).run(name,Number(price),unit,category,shop.id,image,emoji,available==='true'?1:0,Date.now());
  res.status(201).json(productRow(db.prepare(`SELECT p.*,s.name shop_name,s.area shop_area,s.available shop_available FROM products p JOIN shops s ON s.id=p.shop_id WHERE p.id=?`).get(info.lastInsertRowid)));
});
app.put('/api/admin/products/:id',auth('admin'),upload.single('image'),(req,res)=>{
  const p=db.prepare('SELECT * FROM products WHERE id=?').get(Number(req.params.id)); if(!p)return res.status(404).json({error:'Product not found'});
  const {name,price,unit='',category='Staples',shopId,available='true',emoji='🛒'}=req.body;
  const shop=db.prepare('SELECT * FROM shops WHERE id=?').get(Number(shopId)); if(!name||!Number(price)||!shop)return res.status(400).json({error:'Name, price and valid shop are required.'});
  let image=p.image; if(req.file){image=`/uploads/products/${req.file.filename}`; if(p.image && p.image.startsWith('/uploads/')){try{fs.unlinkSync(path.join(ROOT,p.image));}catch{}}} else if(req.body.image!==undefined) image=req.body.image;
  db.prepare(`UPDATE products SET name=?,price=?,unit=?,category=?,shop_id=?,image=?,emoji=?,available=? WHERE id=?`).run(name,Number(price),unit,category,shop.id,image,emoji,available==='true'?1:0,p.id);
  res.json(productRow(db.prepare(`SELECT p.*,s.name shop_name,s.area shop_area,s.available shop_available FROM products p JOIN shops s ON s.id=p.shop_id WHERE p.id=?`).get(p.id)));
});
app.delete('/api/admin/products/:id',auth('admin'),(req,res)=>{
  const p=db.prepare('SELECT * FROM products WHERE id=?').get(Number(req.params.id)); if(!p)return res.status(404).json({error:'Product not found'});
  db.prepare('DELETE FROM products WHERE id=?').run(p.id); if(p.image?.startsWith('/uploads/')){try{fs.unlinkSync(path.join(ROOT,p.image));}catch{}}
  res.json({ok:true});
});

app.post('/api/admin/shops',auth('admin'),(req,res)=>{
  const {name,area='Alipur',phone='',available=true}=req.body||{}; if(!name)return res.status(400).json({error:'Shop name is required.'});
  try{const info=db.prepare('INSERT INTO shops(name,area,phone,available,created_at) VALUES(?,?,?,?,?)').run(name,area,phone,available?1:0,Date.now());res.status(201).json(shopRow(db.prepare('SELECT * FROM shops WHERE id=?').get(info.lastInsertRowid)));}catch(e){res.status(409).json({error:'A shop with that name already exists.'});}
});
app.patch('/api/admin/shops/:id',auth('admin'),(req,res)=>{
  const s=db.prepare('SELECT * FROM shops WHERE id=?').get(Number(req.params.id));if(!s)return res.status(404).json({error:'Shop not found'});
  const {name=s.name,area=s.area,phone=s.phone,available=s.available}=req.body||{};
  try{db.prepare('UPDATE shops SET name=?,area=?,phone=?,available=? WHERE id=?').run(name,area,phone,available?1:0,s.id);res.json(shopRow(db.prepare('SELECT * FROM shops WHERE id=?').get(s.id)));}catch(e){res.status(409).json({error:'A shop with that name already exists.'});}
});
app.delete('/api/admin/shops/:id',auth('admin'),(req,res)=>{
  const s=db.prepare('SELECT * FROM shops WHERE id=?').get(Number(req.params.id));if(!s)return res.status(404).json({error:'Shop not found'});
  const count=db.prepare('SELECT COUNT(*) c FROM products WHERE shop_id=?').get(s.id).c;if(count) return res.status(400).json({error:'This shop still has products. Move or delete those products first.'});
  db.prepare('DELETE FROM shops WHERE id=?').run(s.id);res.json({ok:true});
});

app.get('/api/delivery/stats',auth('delivery'),(req,res)=>{
  const start=new Date(); start.setHours(0,0,0,0); const startMs=start.getTime();
  const endMs=startMs+86400000;
  const newOrders=db.prepare("SELECT COUNT(*) c FROM orders WHERE status='New'").get().c;
  const deliveredToday=db.prepare("SELECT COUNT(*) c FROM orders WHERE status='Delivered' AND delivered_at>=? AND delivered_at<?").get(startMs,endMs).c;
  const earnings=db.prepare("SELECT COALESCE(SUM(delivery_fee),0) total FROM orders WHERE status='Delivered' AND delivered_at>=? AND delivered_at<?").get(startMs,endMs).total;
  res.json({newOrders,deliveredToday,earnings:Number(earnings)||0});
});
app.get('/api/delivery/orders',auth('delivery'),(req,res)=>{
  const rows=db.prepare("SELECT * FROM orders WHERE status NOT IN ('Delivered','Cancelled') ORDER BY created_at ASC").all();res.json(rows.map(orderRow));
});
app.patch('/api/delivery/orders/:code',auth('delivery'),(req,res)=>{
  const o=db.prepare('SELECT * FROM orders WHERE order_code=?').get(req.params.code);if(!o)return res.status(404).json({error:'Order not found'});
  const {status}=req.body||{}; if(!validStatus(status)||status==='Cancelled')return res.status(400).json({error:'Invalid delivery status.'});
  const allowed={New:'Accepted',Accepted:'Picked up','Picked up':'Delivered'}; if(allowed[o.status]!==status)return res.status(400).json({error:`Order is currently ${o.status}. Next step is ${allowed[o.status]||'none'}.`});
  if(status==='Delivered'){db.prepare('UPDATE orders SET status=?, delivered_at=? WHERE id=?').run(status,Date.now(),o.id);}else{db.prepare('UPDATE orders SET status=? WHERE id=?').run(status,o.id);}res.json(orderRow(db.prepare('SELECT * FROM orders WHERE id=?').get(o.id)));
});
app.post('/api/delivery/orders/:code/shop-unavailable',auth('delivery'),(req,res)=>{
  const o=db.prepare('SELECT * FROM orders WHERE order_code=?').get(req.params.code);if(!o)return res.status(404).json({error:'Order not found'});
  const shops=[...new Set(db.prepare('SELECT shop_name FROM order_items WHERE order_id=?').all(o.id).map(x=>x.shop_name))];
  res.json({ok:true,order:o.order_code,message:'Shop unavailable reported to admin.',shops});
});

app.use((err,req,res,next)=>{if(err instanceof multer.MulterError)return res.status(400).json({error:err.message});console.error(err);res.status(500).json({error:'Server error'});});
app.listen(PORT,()=>console.log(`LotusKart running at http://localhost:${PORT}`));
