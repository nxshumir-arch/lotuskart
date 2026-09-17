# LotusKart Admin — How to use

## Start the system
1. Install Node.js 20+.
2. Open this folder in VS Code.
3. In Terminal run `npm install`.
4. Copy `.env.example` to `.env`.
5. Change `ADMIN_KEY` and `DELIVERY_KEY` in `.env`.
6. Run `npm start`.
7. Open `http://localhost:3000/admin.html` for the admin panel.

## Admin workflow
### Dashboard
See total orders, pending orders, product count and shop count.

### Orders
- Filter by New, Accepted, Picked up, Delivered, Cancelled.
- View complete customer/order information.
- Advance order status.
- Cancel orders when necessary.
- Payment method/status is visible.

### Products
- Add products.
- Upload a product image (JPG, PNG, WEBP, GIF up to 5 MB).
- Edit product image, name, price, unit, category and shop.
- Hide/show products without deleting them.
- Delete products.
- Search the catalogue.

### Shops
- Add a new local shop.
- Edit name, area/landmark and phone.
- Mark a shop available/unavailable.
- Delete a shop only when it has no products.

## Delivery partner
Open `http://localhost:3000/delivery.html`.
The delivery key is requested in the delivery page. The partner can accept an order, confirm pickup, mark delivered and report a shop as unavailable.

## Important
This is a real local backend using SQLite and server-side uploads, but it is not production-ready authentication/payment infrastructure yet. Before public launch, add HTTPS, strong authentication, a hosted database/storage service, real UPI gateway verification, customer accounts/OTP and proper deployment secrets.
