# Sistem Laundry - Dokumentasi API Lengkap

Dokumen ini berisi panduan lengkap seluruh *endpoint* REST API dari setiap *microservice* beserta penjelasan penggunaan GraphQL Gateway.

*(Catatan: Anda **TIDAK PERLU** lagi memasukkan header `x-api-key` saat melakukan pengujian, karena fitur tersebut telah dinonaktifkan di semua layanan untuk mempermudah tahap testing).*

---

## 🔗 DAFTAR ENDPOINT REST API (CRUD)

Berikut adalah daftar *endpoint* beserta format JSON Body yang harus diisi ketika melakukan request **POST** (untuk membuat data baru). 

### 1. Customer Service (Port 3003)
*URL via Gateway: `http://localhost:8080/customers` atau `http://localhost:8080/customer-reviews`*
*URL Langsung: `http://localhost:3003/customers` atau `http://localhost:3003/customer-reviews`*

**A. Membuat Customer Baru (POST `/customers`)**
```json
{
  "name": "Andi Darmawan",
  "email": "andi@example.com",
  "phone": "0812345678",
  "address": "Jl. Mawar No. 12"
}
```

**B. Membuat Review Baru (POST `/customer-reviews`)**
```json
{
  "customer_id": 1,
  "rating": 5,
  "review_text": "Pelayanan sangat memuaskan dan cepat!"
}
```

### 2. Laundry Service (Port 3001)
*URL Langsung: `http://localhost:3001/laundry` atau `http://localhost:3001/laundry-categories`*

**A. Membuat Paket Laundry Baru (POST `/laundry`)**
```json
{
  "name": "Cuci Kilat 3 Jam",
  "description": "Selesai dalam 3 jam, khusus pakaian biasa",
  "price": 35000
}
```

**B. Membuat Kategori Laundry Baru (POST `/laundry-categories`)**
```json
{
  "name": "Bed Cover",
  "description": "Kategori khusus untuk bed cover berbagai ukuran"
}
```

### 3. Order Service (Port 5002)
*URL Langsung: `http://localhost:5002/orders` atau `http://localhost:5002/order-items`*

**A. Membuat Order Baru (POST `/orders`)**
```json
{
  "customer_id": 1,
  "service_id": 1,
  "voucher_id": null,
  "order_date": "2026-06-16",
  "weight": 5.5,
  "total_price": 75000,
  "status": "Menunggu"
}
```

**B. Membuat Rincian Item Order (POST `/order-items`)**
```json
{
  "order_id": 1,
  "item_name": "Kemeja Lengan Panjang",
  "quantity": 2,
  "notes": "Hati-hati luntur"
}
```

### 4. Payment Service (Port 5000)
*URL Langsung: `http://localhost:5000/payments` atau `http://localhost:5000/payment-methods`*

**A. Membuat Pembayaran Baru (POST `/payments`)**
```json
{
  "order_id": 1,
  "amount": 75000,
  "payment_method": "Cash",
  "status": "completed"
}
```

**B. Membuat Metode Pembayaran (POST `/payment-methods`)**
```json
{
  "name": "QRIS",
  "description": "Pembayaran dengan scan QRIS"
}
```

### 5. Voucher Service (Port 3004)
*URL Langsung: `http://localhost:3004/vouchers` atau `http://localhost:3004/voucher-usages`*

**A. Membuat Voucher Baru (POST `/vouchers`)**
```json
{
  "code": "PROMOJUNI",
  "discount": 15000,
  "valid_until": "2026-06-30"
}
```

**B. Mencatat Penggunaan Voucher (POST `/voucher-usages`)**
```json
{
  "voucher_id": 1,
  "order_id": 1
}
```

---

## 🕸️ GRAPHQL GATEWAY (Port 4000)

Selain REST API, sistem ini juga menyediakan GraphQL Gateway yang berjalan di:
**URL:** `POST http://localhost:4000/graphql`

### Apa itu GraphQL Gateway?
GraphQL Gateway di sini berfungsi khusus untuk **Query (Mengambil Data)**. Kehebatan GraphQL di sistem ini adalah ia mampu secara otomatis menggabungkan (men-*join*) data dari berbagai *microservice* yang terpisah menjadi satu balasan (response) utuh.

### Contoh Kehebatan GraphQL (Melihat Order beserta Data Pelanggannya):
Jika Anda menggunakan REST API biasa, Anda harus memanggil `/orders` lalu memanggil `/customers/:id` secara terpisah. Dengan GraphQL, Anda bisa meminta Semuanya sekaligus dalam satu kali *request*.

Pada tab **Body** di Postman, pilih **GraphQL** lalu ketikkan *query* berikut:

```graphql
query {
  orders {
    id
    order_date
    total_price
    status
    customer {
      name
      email
    }
    laundryPackage {
      name
      price
    }
  }
}
```

**Query lain yang bisa digunakan:**
- `customers { id, name, email }`
- `laundryPackages { id, name, price }`
- `payments { id, amount, order { status } }`
- `vouchers { id, code, discount }`
