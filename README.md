# LotusKart — Real Local Backend v1

LotusKart is a local quick-commerce system for Alipur with three interfaces:

- `index.html` — customer storefront
- `admin.html` — owner/admin control centre
- `delivery.html` — delivery partner interface

## What is now real

The prototype no longer relies on browser localStorage for the catalogue or orders. The Node/Express backend stores:

- Shops in SQLite
- Products in SQLite
- Orders and order items in SQLite
- Product image uploads on the server
- Product/shop availability
- Order status: New → Accepted → Picked up → Delivered
- Customer cancellation rule: only within 1 minute while the order is still New
- COD and UPI payment method selection

### Important payment note
UPI is currently recorded as a **payment method** with `Pending` payment status. It does not pretend that money was actually collected. A real UPI gateway (Razorpay/PhonePe/other provider) must be connected before launch.

## Run it in VS Code

1. Install Node.js 20+.
2. Open this folder in VS Code.
3. Open Terminal.
4. Run:

```bash
npm install
```

5. Copy `.env.example` to `.env` and change the keys.
6. Start:

```bash
npm start
```

7. Open `http://localhost:3000`.

Customer: `http://localhost:3000/`
Admin: `http://localhost:3000/admin.html`
Delivery: `http://localhost:3000/delivery.html`

Default development keys are the fallback values in `server.js` if `.env` is not created, but **change them before using this outside your own computer**.

## Admin workflow

1. Open `/admin.html`.
2. Enter the admin key once per browser session.
3. Add/edit shops.
4. Add products and upload JPG/PNG/WEBP product images.
5. Change prices, names, categories, shop, availability and images.
6. Watch new customer orders arrive under Orders.
7. Advance/cancel orders when necessary.

## Delivery workflow

1. Open `/delivery.html` on the delivery person's phone/browser.
2. Enter the delivery key.
3. New orders appear automatically when the page is refreshed.
4. Accept → Confirm items collected → Delivered.
5. COD orders clearly show the amount to collect.
6. The driver can call the customer and report an unavailable shop.

## Production next steps

Before taking real customer payments, add:

- Hosted database / managed PostgreSQL
- Secure admin/delivery authentication and user accounts
- HTTPS
- Real UPI payment gateway + webhook verification
- Customer accounts/order history
- Push/SMS/WhatsApp order notifications
- Delivery assignment
- Address/location handling
- Image storage such as S3/Cloudinary
- Rate limiting, audit logs and backups
- Deployment (Render/Railway/Fly/AWS/etc.)
