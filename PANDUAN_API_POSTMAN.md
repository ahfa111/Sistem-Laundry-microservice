# Panduan Lengkap Pengujian API Sistem Laundry di Postman

Dokumen ini berisi panduan langkah demi langkah untuk menguji siklus pemesanan (Order) pada arsitektur Microservices Sistem Laundry.

Sistem ini memiliki **validasi antar-service**, artinya kamu tidak bisa membuat pesanan jika Pelanggan (Customer) atau Paket (Laundry Package) belum terdaftar.

---

## Persiapan di Postman
* **Method:** Selalu gunakan `POST` untuk panduan di bawah ini.
* **Body Format:** Pilih `raw` lalu ubah dropdown menjadi `JSON`.

---

## Langkah 1: Daftarkan Pelanggan Baru (Customer Service)
Kita harus membuat data pelanggan terlebih dahulu agar mendapatkan `customer_id` yang valid.

* **URL:** `http://localhost:8080/customers`
* **JSON Body:**
```json
{
  "name": "Bapak Budi",
  "email": "budi@email.com",
  "phone": "081234567890",
  "address": "Jl. Mawar No. 12"
}
```
> **Catatan:** Setelah berhasil, catat `id` yang dikembalikan oleh API (misalnya `"id": 1`).

---

## Langkah 2: Buat Paket Laundry (Laundry Service)
Kita perlu membuat paket jasa laundry agar mendapatkan `service_id`.

* **URL:** `http://localhost:8080/laundry`
* **JSON Body:**
```json
{
  "name": "Cuci Kering Karpet",
  "description": "Cuci karpet super bersih wangi",
  "price": 50000
}
```
> **Catatan:** Catat `id` yang dikembalikan oleh API (misalnya `"id": 1`).

---

## Langkah 3: Buat Pesanan (Order Service)
Gabungkan ID Pelanggan (`customer_id`) dan ID Paket (`service_id`) yang didapat dari Langkah 1 & 2.

* **URL:** `http://localhost:8080/orders`
* **JSON Body:**
```json
{
  "customer_id": 1, 
  "service_id": 1, 
  "order_date": "2026-06-09", 
  "weight": 2.0, 
  "total_price": 100000,
  "status": "Menunggu Pembayaran"
}
```
> **Catatan:** Jika kamu asal memasukkan `customer_id` yang tidak terdaftar, API akan **menolak** pesanan tersebut. Jika berhasil, catat Order ID-nya (misal `"id": 1`).

---

## Langkah 4: Lakukan Pembayaran (Payment Service)
Gunakan ID Pesanan (`order_id`) dari Langkah 3 untuk melakukan pembayaran.

* **URL:** `http://localhost:8080/payments`
* **JSON Body:**
```json
{
  "order_id": 1,
  "amount": 100000,
  "status": "Lunas",
  "payment_method": "Transfer Bank"
}
```
> **Catatan:** API akan mengecek ke database Order. Jika `order_id` tidak valid, pembayaran akan ditolak.

---

## Langkah 5: Lihat Hasil Akhir Terpadu (GraphQL Gateway)
Untuk melihat seluruh data yang sudah terintegrasi (menampilkan nama asli pelanggan dan paket, bukan sekadar ID angka), gunakan GraphQL.

* **URL:** `http://localhost:4000/graphql`
* **JSON Body:** (Tetap gunakan format `raw` -> `JSON`)
```json
{
  "query": "query { orders { id status total_price customer { name phone address } laundryPackage { name price } payment { status payment_method } } }"
}
```

Ketika di-Send, kamu akan mendapatkan satu respon JSON utuh yang menampilkan detail pesanan, data diri pelanggan, paket yang dipilih, hingga status pelunasan pembayarannya dalam satu kali tarik!
