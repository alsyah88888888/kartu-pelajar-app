const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("../client"));

let siswaData = [];
let adminUsers = [];
let cetakanData = [];

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

async function initData() {
  try {
    const hashedPassword = await hashPassword("admin123");
    adminUsers = [
      {
        id: 1,
        username: "admin",
        password: hashedPassword,
        nama_lengkap: "Administrator",
        level: "superadmin",
        created_at: new Date().toISOString(),
      },
    ];

    siswaData = [
      {
        id: 1,
        nama: "Andi Pratama",
        nis: "20230001",
        kelas: "XII IPA 1",
        jurusan: "IPA",
        tempat_lahir: "Jakarta",
        tanggal_lahir: "2006-05-15",
        alamat: "Jl. Merdeka No. 123, Jakarta Pusat",
        no_hp: "081234567890",
        foto_url: "",
        qr_code: "KARTU20230001",
        tanggal_dibuat: new Date().toISOString(),
        status: "active",
      },
      {
        id: 2,
        nama: "Budi Santoso",
        nis: "20230002",
        kelas: "XII IPA 2",
        jurusan: "IPA",
        tempat_lahir: "Bandung",
        tanggal_lahir: "2006-08-20",
        alamat: "Jl. Sudirman No. 45, Bandung",
        no_hp: "081298765432",
        foto_url: "",
        qr_code: "KARTU20230002",
        tanggal_dibuat: new Date().toISOString(),
        status: "active",
      },
      {
        id: 3,
        nama: "Siti Rahmawati",
        nis: "20230003",
        kelas: "XI IPS 1",
        jurusan: "IPS",
        tempat_lahir: "Surabaya",
        tanggal_lahir: "2007-03-10",
        alamat: "Jl. Pahlawan No. 78, Surabaya",
        no_hp: "081345678901",
        foto_url: "",
        qr_code: "KARTU20230003",
        tanggal_dibuat: new Date().toISOString(),
        status: "active",
      },
    ];

    cetakanData = [
      {
        id: 1,
        siswa_id: 1,
        tanggal_cetak: new Date().toISOString(),
        jenis_cetak: "digital",
        dicetak_oleh: 1,
      },
    ];

    console.log("✅ Data initialized successfully");
    console.log(`👤 Admin: admin / admin123`);
    console.log(`📊 Sample students: ${siswaData.length}`);
  } catch (error) {
    console.error("❌ Initialization error:", error);
  }
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access token required",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || "secret_key", (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: "Invalid token",
      });
    }
    req.user = user;
    next();
  });
};

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "../client" });
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "🎉 Kartu Pelajar API is running!",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        login: "POST /api/login",
      },
      siswa: {
        list: "GET /api/siswa",
        create: "POST /api/siswa",
        detail: "GET /api/siswa/:id",
        update: "PUT /api/siswa/:id",
        delete: "DELETE /api/siswa/:id",
        pdf: "GET /api/siswa/:id/pdf",
      },
      admin: {
        stats: "GET /api/stats",
        dashboard: "GET /api/dashboard",
      },
      tools: {
        search: "GET /api/search",
        settings: "GET /api/settings",
      },
    },
  });
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username dan password harus diisi",
      });
    }

    const user = adminUsers.find((u) => u.username === username);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Username atau password salah",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: "Username atau password salah",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        level: user.level,
      },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        level: user.level,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.post("/api/register", authenticateToken, async (req, res) => {
  try {
    const { username, password, nama_lengkap } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username dan password harus diisi",
      });
    }

    const existingUser = adminUsers.find((u) => u.username === username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Username sudah digunakan",
      });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = {
      id: adminUsers.length + 1,
      username,
      password: hashedPassword,
      nama_lengkap: nama_lengkap || username,
      level: "admin",
      created_at: new Date().toISOString(),
    };

    adminUsers.push(newUser);

    res.status(201).json({
      success: true,
      message: "Admin berhasil ditambahkan",
      user: {
        id: newUser.id,
        username: newUser.username,
        nama_lengkap: newUser.nama_lengkap,
        level: newUser.level,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.get("/api/siswa", (req, res) => {
  try {
    const {
      search = "",
      kelas = "",
      page = 1,
      limit = 10,
      status = "active",
    } = req.query;

    let filteredData = siswaData.filter((s) => s.status === status);

    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(
        (s) =>
          s.nama.toLowerCase().includes(searchLower) ||
          s.nis.toLowerCase().includes(searchLower) ||
          s.kelas.toLowerCase().includes(searchLower)
      );
    }

    if (kelas) {
      filteredData = filteredData.filter((s) => s.kelas === kelas);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    const uniqueClasses = [
      ...new Set(
        siswaData
          .filter((s) => s.status === "active")
          .map((s) => s.kelas)
          .sort()
      ),
    ];

    res.json({
      success: true,
      data: paginatedData,
      meta: {
        total: filteredData.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(filteredData.length / limitNum),
        hasNext: endIndex < filteredData.length,
        hasPrev: startIndex > 0,
      },
      filters: {
        kelas: uniqueClasses,
      },
    });
  } catch (error) {
    console.error("Get siswa error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.post("/api/siswa", async (req, res) => {
  try {
    const {
      nama,
      nis,
      kelas,
      jurusan,
      tempat_lahir,
      tanggal_lahir,
      alamat,
      no_hp,
      foto,
    } = req.body;

    if (!nama || !nis || !kelas) {
      return res.status(400).json({
        success: false,
        error: "Nama, NIS, dan Kelas harus diisi",
      });
    }

    const existing = siswaData.find(
      (s) => s.nis === nis && s.status === "active"
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "NIS sudah terdaftar",
      });
    }

    const qrCode = `KARTU${nis}${Date.now().toString().slice(-4)}`;

    const newSiswa = {
      id:
        siswaData.length > 0 ? Math.max(...siswaData.map((s) => s.id)) + 1 : 1,
      nama: nama.toUpperCase(),
      nis,
      kelas,
      jurusan: jurusan || "",
      tempat_lahir: tempat_lahir || "",
      tanggal_lahir: tanggal_lahir || "",
      alamat: alamat || "",
      no_hp: no_hp || "",
      foto_url: foto || "",
      qr_code: qrCode,
      tanggal_dibuat: new Date().toISOString(),
      status: "active",
    };

    siswaData.push(newSiswa);

    cetakanData.push({
      id: cetakanData.length + 1,
      siswa_id: newSiswa.id,
      tanggal_cetak: new Date().toISOString(),
      jenis_cetak: "digital",
      dicetak_oleh: null,
    });

    res.status(201).json({
      success: true,
      message: "✅ Kartu pelajar berhasil dibuat!",
      data: newSiswa,
      pdf_url: `/api/siswa/${newSiswa.id}/pdf`,
      print_url: `/api/print/${newSiswa.id}`,
    });
  } catch (error) {
    console.error("Create siswa error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.get("/api/siswa/:id", (req, res) => {
  try {
    const siswa = siswaData.find(
      (s) => s.id == req.params.id && s.status === "active"
    );

    if (!siswa) {
      return res.status(404).json({
        success: false,
        error: "Siswa tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: siswa,
    });
  } catch (error) {
    console.error("Get siswa error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.put("/api/siswa/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const index = siswaData.findIndex((s) => s.id == id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: "Siswa tidak ditemukan",
      });
    }

    if (updateData.nis && updateData.nis !== siswaData[index].nis) {
      const duplicate = siswaData.find(
        (s) => s.nis === updateData.nis && s.status === "active"
      );
      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: "NIS sudah digunakan oleh siswa lain",
        });
      }
    }

    siswaData[index] = {
      ...siswaData[index],
      ...updateData,
      nama: updateData.nama
        ? updateData.nama.toUpperCase()
        : siswaData[index].nama,
    };

    res.json({
      success: true,
      message: "✅ Data siswa berhasil diperbarui",
      data: siswaData[index],
    });
  } catch (error) {
    console.error("Update siswa error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.delete("/api/siswa/:id", authenticateToken, (req, res) => {
  try {
    const index = siswaData.findIndex((s) => s.id == req.params.id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: "Siswa tidak ditemukan",
      });
    }

    siswaData[index].status = "deleted";

    res.json({
      success: true,
      message: "✅ Siswa berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete siswa error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.get("/api/siswa/:id/pdf", (req, res) => {
  try {
    const siswa = siswaData.find(
      (s) => s.id == req.params.id && s.status === "active"
    );

    if (!siswa) {
      return res.status(404).json({
        success: false,
        error: "Siswa tidak ditemukan",
      });
    }

    const tglLahir = siswa.tanggal_lahir
      ? new Date(siswa.tanggal_lahir).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

    const html = `<!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Kartu Pelajar - ${siswa.nama}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Montserrat:wght@400;600;700&display=swap');
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Poppins', sans-serif;
                        background: #f5f5f5;
                        padding: 20px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                    }
                    
                    .kartu-container {
                        width: 85mm;
                        height: 54mm;
                        background: white;
                        border-radius: 10px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                        overflow: hidden;
                        position: relative;
                    }
                    
                    .kartu-header {
                        background: linear-gradient(135deg, #2563eb, #1d4ed8);
                        color: white;
                        padding: 10px 15px;
                        text-align: center;
                    }
                    
                    .kartu-header h1 {
                        font-family: 'Montserrat', sans-serif;
                        font-size: 16px;
                        margin: 0;
                        font-weight: 700;
                        letter-spacing: 1px;
                    }
                    
                    .kartu-header h2 {
                        font-size: 12px;
                        margin: 2px 0 0 0;
                        font-weight: 400;
                        opacity: 0.9;
                    }
                    
                    .kartu-content {
                        display: flex;
                        padding: 15px;
                        height: calc(100% - 50px);
                    }
                    
                    .foto-section {
                        flex: 0 0 30mm;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        border-right: 2px dashed #e5e7eb;
                        padding-right: 10px;
                    }
                    
                    .foto-placeholder {
                        width: 25mm;
                        height: 30mm;
                        background: #f3f4f6;
                        border: 2px solid #d1d5db;
                        border-radius: 5px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 5px;
                        overflow: hidden;
                    }
                    
                    .foto-placeholder img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    
                    .foto-label {
                        font-size: 9px;
                        color: #6b7280;
                        text-align: center;
                    }
                    
                    .data-section {
                        flex: 1;
                        padding-left: 15px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }
                    
                    .data-row {
                        display: flex;
                        margin-bottom: 4px;
                        font-size: 10px;
                    }
                    
                    .data-label {
                        font-weight: 600;
                        color: #374151;
                        width: 70px;
                        flex-shrink: 0;
                    }
                    
                    .data-value {
                        color: #111827;
                        flex: 1;
                    }
                    
                    .kartu-footer {
                        position: absolute;
                        bottom: 10px;
                        left: 15px;
                        right: 15px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        font-size: 8px;
                        color: #6b7280;
                    }
                    
                    .qr-code {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    
                    .qr-box {
                        width: 25px;
                        height: 25px;
                        background: #f3f4f6;
                        border: 1px solid #d1d5db;
                        border-radius: 3px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 2px;
                        font-size: 6px;
                        font-weight: bold;
                    }
                    
                    .valid-info {
                        text-align: right;
                    }
                    
                    .barcode {
                        font-family: 'Courier New', monospace;
                        font-size: 9px;
                        letter-spacing: 1px;
                        background: #f9fafb;
                        padding: 3px 6px;
                        border-radius: 3px;
                        border: 1px solid #e5e7eb;
                        margin-top: 5px;
                    }
                    
                    .logo-sekolah {
                        position: absolute;
                        top: 10px;
                        left: 15px;
                        width: 20px;
                        height: 20px;
                        background: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        color: #2563eb;
                        font-weight: bold;
                    }
                    
                    .watermark {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-45deg);
                        font-size: 30px;
                        color: rgba(37, 99, 235, 0.1);
                        font-weight: bold;
                        white-space: nowrap;
                        pointer-events: none;
                        user-select: none;
                    }
                </style>
            </head>
            <body>
                <div class="kartu-container">
                    <div class="watermark">KARTU PELAJAR</div>
                    
                    <div class="logo-sekolah">
                        S
                    </div>
                    
                    <div class="kartu-header">
                        <h1>KARTU PELAJAR</h1>
                        <h2>SMA NEGERI 1 DIGITAL</h2>
                    </div>
                    
                    <div class="kartu-content">
                        <div class="foto-section">
                            <div class="foto-placeholder">
                                ${
                                  siswa.foto_url
                                    ? `<img src="${siswa.foto_url}" alt="Foto ${siswa.nama}">`
                                    : `<div style="text-align: center; color: #9ca3af; font-size: 8px;">FOTO<br>3x4</div>`
                                }
                            </div>
                            <div class="foto-label">PAS FOTO</div>
                        </div>
                        
                        <div class="data-section">
                            <div class="data-row">
                                <div class="data-label">NAMA</div>
                                <div class="data-value">: ${siswa.nama}</div>
                            </div>
                            <div class="data-row">
                                <div class="data-label">NIS</div>
                                <div class="data-value">: ${siswa.nis}</div>
                            </div>
                            <div class="data-row">
                                <div class="data-label">KELAS</div>
                                <div class="data-value">: ${siswa.kelas}</div>
                            </div>
                            <div class="data-row">
                                <div class="data-label">JURUSAN</div>
                                <div class="data-value">: ${siswa.jurusan}</div>
                            </div>
                            <div class="data-row">
                                <div class="data-label">TTL</div>
                                <div class="data-value">: ${
                                  siswa.tempat_lahir
                                }${tglLahir ? ", " + tglLahir : ""}</div>
                            </div>
                            <div class="data-row">
                                <div class="data-label">ALAMAT</div>
                                <div class="data-value">: ${siswa.alamat.substring(
                                  0,
                                  30
                                )}${siswa.alamat.length > 30 ? "..." : ""}</div>
                            </div>
                            
                            <div class="barcode">
                                ${siswa.qr_code}
                            </div>
                        </div>
                    </div>
                    
                    <div class="kartu-footer">
                        <div class="qr-code">
                            <div class="qr-box">QR</div>
                            <div>SCAN ME</div>
                        </div>
                        
                        <div class="valid-info">
                            <div>Berlaku: Juni 2024</div>
                            <div>Dicetak: ${new Date().toLocaleDateString(
                              "id-ID"
                            )}</div>
                        </div>
                    </div>
                </div>
                
                <script>
                    setTimeout(() => {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    }, 1000);
                </script>
            </body>
            </html>`;

    res.setHeader("Content-Type", "text/html");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="kartu-pelajar-${siswa.nis}.html"`
    );
    res.send(html);

    cetakanData.push({
      id: cetakanData.length + 1,
      siswa_id: siswa.id,
      tanggal_cetak: new Date().toISOString(),
      jenis_cetak: "pdf",
      dicetak_oleh: null,
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.get("/api/stats", (req, res) => {
  try {
    const activeSiswa = siswaData.filter((s) => s.status === "active");
    const totalSiswa = activeSiswa.length;
    const totalCetakan = cetakanData.length;
    const totalAdmin = adminUsers.length;

    const kelasStats = {};
    activeSiswa.forEach((siswa) => {
      if (!kelasStats[siswa.kelas]) {
        kelasStats[siswa.kelas] = 0;
      }
      kelasStats[siswa.kelas]++;
    });

    const jurusanStats = {};
    activeSiswa.forEach((siswa) => {
      const jurusan = siswa.jurusan || "Belum Ditentukan";
      if (!jurusanStats[jurusan]) {
        jurusanStats[jurusan] = 0;
      }
      jurusanStats[jurusan]++;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCetakan = cetakanData.filter(
      (c) => new Date(c.tanggal_cetak) >= today
    ).length;

    const todaySiswa = activeSiswa.filter(
      (s) => new Date(s.tanggal_dibuat) >= today
    ).length;

    res.json({
      success: true,
      data: {
        total_siswa: totalSiswa,
        total_cetakan: totalCetakan,
        total_admin: totalAdmin,
        today_cetakan: todayCetakan,
        today_siswa: todaySiswa,
        per_kelas: kelasStats,
        per_jurusan: jurusanStats,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.get("/api/dashboard", authenticateToken, (req, res) => {
  try {
    const recentSiswa = siswaData
      .filter((s) => s.status === "active")
      .sort((a, b) => new Date(b.tanggal_dibuat) - new Date(a.tanggal_dibuat))
      .slice(0, 10)
      .map((s) => ({
        id: s.id,
        nama: s.nama,
        nis: s.nis,
        kelas: s.kelas,
        tanggal_dibuat: s.tanggal_dibuat,
      }));

    const recentCetakan = cetakanData
      .sort((a, b) => new Date(b.tanggal_cetak) - new Date(a.tanggal_cetak))
      .slice(0, 10)
      .map((c) => {
        const siswa = siswaData.find((s) => s.id === c.siswa_id);
        return {
          id: c.id,
          siswa_id: c.siswa_id,
          siswa_nama: siswa ? siswa.nama : "Unknown",
          siswa_nis: siswa ? siswa.nis : "Unknown",
          tanggal_cetak: c.tanggal_cetak,
          jenis_cetak: c.jenis_cetak,
        };
      });

    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);

    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      const monthYear = date.toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      });

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthSiswa = siswaData.filter((s) => {
        const created = new Date(s.tanggal_dibuat);
        return (
          created >= monthStart && created <= monthEnd && s.status === "active"
        );
      }).length;

      const monthCetakan = cetakanData.filter((c) => {
        const printed = new Date(c.tanggal_cetak);
        return printed >= monthStart && printed <= monthEnd;
      }).length;

      monthlyData.push({
        month: monthYear,
        siswa: monthSiswa,
        cetakan: monthCetakan,
      });
    }

    res.json({
      success: true,
      data: {
        recent_siswa: recentSiswa,
        recent_cetakan: recentCetakan,
        monthly_stats: monthlyData,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.get("/api/search", (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: [],
        message: "Masukkan minimal 2 karakter",
      });
    }

    const searchTerm = q.toLowerCase().trim();
    const results = siswaData.filter(
      (s) =>
        s.status === "active" &&
        (s.nama.toLowerCase().includes(searchTerm) ||
          s.nis.toLowerCase().includes(searchTerm) ||
          s.kelas.toLowerCase().includes(searchTerm) ||
          (s.jurusan && s.jurusan.toLowerCase().includes(searchTerm)))
    );

    res.json({
      success: true,
      data: results.slice(0, 20),
      total: results.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

const defaultSettings = {
  nama_sekolah: "SMA NEGERI 1 DIGITAL",
  alamat_sekolah: "Jl. Pendidikan No. 123, Kota Digital, Jawa Barat",
  tahun_ajaran: "2023/2024",
  email_sekolah: "info@sman1digital.sch.id",
  telepon_sekolah: "(021) 1234-5678",
  website: "www.sman1digital.sch.id",
  kepala_sekolah: "Dr. H. Ahmad Budiman, M.Pd",
  nip_kepsek: "196512151992031002",
  logo_url: "https://via.placeholder.com/100x100/2563eb/ffffff?text=SD",
  warna_utama: "#2563eb",
  ukuran_kartu: "85mm x 54mm",
  masa_berlaku: "1 Tahun",
};

app.get("/api/settings", (req, res) => {
  res.json({
    success: true,
    data: defaultSettings,
  });
});

app.get("/api/backup", authenticateToken, (req, res) => {
  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      siswa: siswaData.filter((s) => s.status === "active"),
      admin: adminUsers.map((u) => ({
        id: u.id,
        username: u.username,
        nama_lengkap: u.nama_lengkap,
        level: u.level,
        created_at: u.created_at,
      })),
      cetakan: cetakanData,
      settings: defaultSettings,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="backup-${
        new Date().toISOString().split("T")[0]
      }.json"`
    );
    res.json(backupData);
  } catch (error) {
    console.error("Backup error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.get("/api/print/:id", (req, res) => {
  res.redirect(`/api/siswa/${req.params.id}/pdf`);
});

app.get("/api/check-nis/:nis", (req, res) => {
  try {
    const existing = siswaData.find(
      (s) => s.nis === req.params.nis && s.status === "active"
    );

    res.json({
      success: true,
      available: !existing,
      message: existing ? "NIS sudah terdaftar" : "NIS tersedia",
    });
  } catch (error) {
    console.error("Check NIS error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.post("/api/upload", (req, res) => {
  try {
    const { image } = req.body;

    if (!image || !image.startsWith("data:image")) {
      return res.status(400).json({
        success: false,
        error: "Format gambar tidak valid",
      });
    }

    res.json({
      success: true,
      url: image,
      message: "Gambar berhasil diupload",
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      error: "Gagal mengupload gambar",
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    siswa_count: siswaData.filter((s) => s.status === "active").length,
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint tidak ditemukan",
    path: req.path,
    method: req.method,
  });
});

app.use((err, req, res, next) => {
  console.error("🚨 Server error:", err);
  res.status(500).json({
    success: false,
    error: "Terjadi kesalahan pada server",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, async () => {
  await initData();
  console.log("\n" + "=".repeat(50));
  console.log("🚀 KARTU PELAJAR DIGITAL - BACKEND SERVER");
  console.log("=".repeat(50));
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log("📋 Available endpoints:");
  console.log("   GET  /api              - API Documentation");
  console.log("   POST /api/login        - Login admin");
  console.log("   GET  /api/siswa        - List all students");
  console.log("   POST /api/siswa        - Create new student");
  console.log("   GET  /api/siswa/:id    - Get student detail");
  console.log("   GET  /api/siswa/:id/pdf - Generate PDF card");
  console.log("   GET  /api/stats        - System statistics");
  console.log("   GET  /api/search?q=    - Search students");
  console.log("\n👤 Default Admin Credentials:");
  console.log("   Username: admin");
  console.log("   Password: admin123");
  console.log("=".repeat(50) + "\n");
});
