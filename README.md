# 🛏️ Kasur vs Bantal - Lazy Night 🌙

Sebuah game web interaktif sederhana berbasis HTML5 Canvas menggunakan framework **Phaser 3**. Dalam game ini, pemain harus mengendalikan kasur untuk menangkap bantal-bantal yang jatuh dari langit sebelum waktu habis.

---

## 🎮 Cara Bermain
1. **Tujuan**: Tangkap bantal sebanyak-banyaknya untuk mendapatkan skor tertinggi sebelum waktu habis.
2. **Durasi**: Anda memiliki waktu **30 detik** per ronde permainan.
3. **Kontrol**:
   * **PC / Laptop**: Gerakkan mouse ke kanan dan kiri (kursor), atau gunakan tombol **Panah Kiri (←)** dan **Panah Kanan (→)** di keyboard.
   * **HP / Tablet (Touchscreen)**: Geser jari Anda ke kanan dan kiri pada layar.
4. **Skor**: Setiap bantal yang berhasil ditangkap akan menambah **1 poin** skor Anda.
5. **Skor Tertinggi**: Skor terbaik Anda akan disimpan secara lokal di browser (*Local Storage*).

---

## 🛠️ Teknologi yang Digunakan
* **Phaser 3**: Framework game HTML5 yang digunakan untuk menangani *physics*, rendering gambar, kontrol, dan perulangan game (*game loop*).
* **HTML5 Canvas & CSS3**: Digunakan untuk struktur layout, desain antarmuka (*UI*) modern, serta efek *glassmorphism* dan animasi modal game over.
* **Web Audio API**: Digunakan untuk menghasilkan efek suara sintetis (*retro arcade click*) saat bantal berhasil ditangkap tanpa memerlukan file audio eksternal.

---

## 💻 Cara Menjalankan Secara Lokal
Untuk menjalankan game ini di komputer Anda sendiri:

1. **Clone repositori** ini atau unduh folder project.
2. Karena game ini memuat aset lokal (seperti gambar background dan bantal), disarankan untuk menjalankannya menggunakan server lokal agar tidak terkena kendala keamanan browser (*CORS policy*).
3. Anda bisa menggunakan beberapa cara berikut untuk menjalankan server lokal:
   * **VS Code (Live Server Extension)**: Klik kanan pada file `index.html` dan pilih **Open with Live Server**.
   * **Node.js (http-server)**:
     ```bash
     npx http-server
     ```
   * **Python**:
     ```bash
     python -m http.server 8000
     ```
4. Buka alamat server tersebut di browser Anda (misalnya `http://localhost:8000` atau `http://127.0.0.1:5500`).

---

## 🚀 Cara Mengunggah ke GitHub Pages
Jika Anda ingin mempublikasikan game ini secara gratis melalui GitHub Pages:

1. Buat repositori baru di GitHub dan unggah project Anda di sana.
2. Masuk ke tab **Settings** pada repositori GitHub Anda.
3. Di menu sebelah kiri, pilih **Pages**.
4. Di bagian **Build and deployment**, pilih branch utama Anda (misalnya `main` atau `master`) dan folder `/ (root)`.
5. Klik **Save**.
6. Tunggu beberapa saat, GitHub akan memproses deployment Anda. Game Anda akan bisa diakses melalui URL: `https://<username-github>.github.io/<nama-repositori>/`.
