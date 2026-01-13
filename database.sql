CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(100),
    level VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE siswa (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    nis VARCHAR(20) UNIQUE NOT NULL,
    kelas VARCHAR(20),
    jurusan VARCHAR(30),
    tempat_lahir VARCHAR(50),
    tanggal_lahir DATE,
    alamat TEXT,
    no_hp VARCHAR(15),
    foto_url TEXT,
    qr_code TEXT,
    tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE cetakan_kartu (
    id SERIAL PRIMARY KEY,
    siswa_id INTEGER REFERENCES siswa(id),
    tanggal_cetak TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    jenis_cetak VARCHAR(20), -- digital, pdf, fisik
    dicetak_oleh INTEGER REFERENCES admin_users(id)
);

CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT,
    keterangan TEXT
);

INSERT INTO admin_users (username, password, nama_lengkap) 
VALUES ('admin', '$2a$10$YourHashedPasswordHere', 'Administrator');

INSERT INTO settings (setting_key, setting_value, keterangan) VALUES
('nama_sekolah', 'SMA NEGERI 1 DIGITAL', 'Nama sekolah untuk kartu'),
('alamat_sekolah', 'Jl. Pendidikan No. 123, Kota Digital', 'Alamat sekolah'),
('logo_sekolah', 'https://example.com/logo.png', 'URL logo sekolah'),
('tahun_ajaran', '2023/2024', 'Tahun ajaran aktif'),
('email_sekolah', 'info@sman1digital.sch.id', 'Email sekolah');