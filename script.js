document.addEventListener("DOMContentLoaded", function () {
  console.log("🎯 Kartu Pelajar Digital - Frontend Initialized");

  const API_BASE_URL = "http://localhost:3000/api";

  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");
  const uploadArea = document.getElementById("uploadArea");
  const fotoInput = document.getElementById("fotoInput");
  const previewContainer = document.getElementById("previewContainer");
  const kartuForm = document.getElementById("kartuForm");
  const previewBtn = document.getElementById("previewBtn");
  const previewModal = document.getElementById("previewModal");
  const closeModalBtns = document.querySelectorAll(".close-modal");
  const downloadPdfBtn = document.getElementById("downloadPdf");
  const toast = document.getElementById("toast");
  const adminLink = document.getElementById("adminLink");
  const searchInput =
    document.getElementById("searchInput") || document.createElement("input");

  let currentFoto = null;
  let isOnline = true;

  checkApiConnection();
  loadInitialData();
  setupAdminLink();

  hamburger?.addEventListener("click", function () {
    navLinks?.classList.toggle("active");
  });

  uploadArea?.addEventListener("click", function () {
    fotoInput?.click();
  });

  uploadArea?.addEventListener("dragover", function (e) {
    e.preventDefault();
    this.style.borderColor = "#2563eb";
    this.style.backgroundColor = "#f0f7ff";
  });

  uploadArea?.addEventListener("dragleave", function () {
    this.style.borderColor = "#e5e7eb";
    this.style.backgroundColor = "transparent";
  });

  uploadArea?.addEventListener("drop", function (e) {
    e.preventDefault();
    this.style.borderColor = "#e5e7eb";
    this.style.backgroundColor = "transparent";

    if (e.dataTransfer.files.length) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  });

  fotoInput?.addEventListener("change", function (e) {
    if (this.files.length) {
      handleImageUpload(this.files[0]);
    }
  });

  previewBtn?.addEventListener("click", function () {
    if (!validateForm()) {
      showToast("Harap lengkapi semua data yang diperlukan", "error");
      return;
    }

    generateKartuPreview();
    previewModal.style.display = "flex";
  });

  kartuForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await submitForm();
  });

  downloadPdfBtn?.addEventListener("click", function () {
    generatePDF();
  });

  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      previewModal.style.display = "none";
    });
  });

  window.addEventListener("click", function (e) {
    if (e.target === previewModal) {
      previewModal.style.display = "none";
    }
  });

  const nisInput = document.getElementById("nis");
  nisInput?.addEventListener("blur", async function () {
    if (this.value.length > 3) {
      await checkNisAvailability(this.value);
    }
  });

  const kelasSelect = document.getElementById("kelas");
  kelasSelect?.addEventListener("change", function () {});

  function handleImageUpload(file) {
    if (!file.type.match("image.*")) {
      showToast("Hanya file gambar yang diperbolehkan", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Ukuran file maksimal 2MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.className = "preview-image";
      img.alt = "Preview Foto";
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const targetWidth = 300;
        const targetHeight = 400;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const scale = Math.max(
          targetWidth / img.width,
          targetHeight / img.height
        );

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        ctx.drawImage(
          img,
          (scaledWidth - targetWidth) / 2 / scale,
          (scaledHeight - targetHeight) / 2 / scale,
          targetWidth / scale,
          targetHeight / scale,
          0,
          0,
          targetWidth,
          targetHeight
        );

        const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        currentFoto = croppedDataUrl;

        previewContainer.innerHTML = "";
        const croppedImg = document.createElement("img");
        croppedImg.src = croppedDataUrl;
        croppedImg.className = "preview-image";
        croppedImg.alt = "Foto 3x4";
        previewContainer.appendChild(croppedImg);

        showToast("Foto berhasil diupload dan dioptimalkan", "success");
      };
    };
    reader.readAsDataURL(file);
  }

  function validateForm() {
    const requiredFields = kartuForm?.querySelectorAll("[required]") || [];
    let isValid = true;

    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        isValid = false;
        field.style.borderColor = "#ef4444";
        field.classList.add("error");
      } else {
        field.style.borderColor = "#e5e7eb";
        field.classList.remove("error");
      }
    });

    const nis = document.getElementById("nis")?.value;
    if (nis && !/^\d{5,10}$/.test(nis)) {
      showToast("NIS harus berupa angka (5-10 digit)", "error");
      document.getElementById("nis").style.borderColor = "#ef4444";
      isValid = false;
    }

    const noHp = document.getElementById("no_hp")?.value;
    if (noHp && !/^[0-9+\-\s()]{10,15}$/.test(noHp)) {
      showToast("Format nomor HP tidak valid", "error");
      document.getElementById("no_hp").style.borderColor = "#ef4444";
      isValid = false;
    }

    if (!currentFoto) {
      showToast("Harap upload foto terlebih dahulu", "error");
      isValid = false;
    }

    return isValid;
  }

  function generateKartuPreview() {
    const kartuPreview = document.getElementById("kartuPreview");
    if (!kartuPreview) return;

    const data = {
      nama: document.getElementById("nama")?.value || "",
      nis: document.getElementById("nis")?.value || "",
      kelas: document.getElementById("kelas")?.value || "",
      jurusan: document.getElementById("jurusan")?.value || "",
      tempat_lahir: document.getElementById("tempat_lahir")?.value || "",
      tanggal_lahir: document.getElementById("tanggal_lahir")?.value || "",
      alamat: document.getElementById("alamat")?.value || "",
      no_hp: document.getElementById("no_hp")?.value || "",
    };

    let formattedTglLahir = "";
    if (data.tanggal_lahir) {
      const tglLahir = new Date(data.tanggal_lahir);
      if (!isNaN(tglLahir.getTime())) {
        formattedTglLahir = tglLahir.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }
    }

    kartuPreview.innerHTML = `
      <div class="kartu-preview-container">
        <div class="kartu-header-preview">
          <h2>KARTU PELAJAR</h2>
          <p>SMA NEGERI 1 DIGITAL</p>
          <p>Tahun Pelajaran 2023/2024</p>
        </div>
        
        <div class="kartu-content-preview">
          <div class="foto-section">
            <img src="${
              currentFoto ||
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTUwLDIwMCkiPjxjaXJjbGUgcj0iNTAiIGZpbGw9IiNkMWQ1ZGIiLz48cGF0aCBkPSJNLTQwLDIwIGExNSwxNSwwLDEsMCwzMCwwIGExNSwxNSwwLDEsMC0zMCwwWiIgZmlsbD0iIzljYTNhZiIvPjxwYXRoIGQ9Ik0tMjUsNjUgYTUwLDMwLDAsMSwwLDUwLDAgYTUwLDMwLDAsMSwwLTUwLDAgWiIgZmlsbD0iIzljYTNhZiIvPjwvZz48dGV4dCB4PSIxNTAiIHk9IjM1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNmI3MjgwIj5GT1RPIHM8L3RleHQ+PHRleHQgeD0iMTUwIiB5PSIzNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCI+M3g0PC90ZXh0Pjwvc3ZnPg=="
            }" 
                 alt="Foto ${data.nama}" 
                 class="foto-preview">
            <div class="foto-label">FOTO 3x4</div>
          </div>
          
          <div class="data-section">
            <table class="data-table">
              <tr>
                <td><strong>Nama</strong></td>
                <td>:</td>
                <td>${data.nama.toUpperCase()}</td>
              </tr>
              <tr>
                <td><strong>NIS</strong></td>
                <td>:</td>
                <td>${data.nis}</td>
              </tr>
              <tr>
                <td><strong>Kelas</strong></td>
                <td>:</td>
                <td>${data.kelas}</td>
              </tr>
              <tr>
                <td><strong>Jurusan</strong></td>
                <td>:</td>
                <td>${data.jurusan}</td>
              </tr>
              <tr>
                <td><strong>Tempat/Tgl Lahir</strong></td>
                <td>:</td>
                <td>${data.tempat_lahir}${
      formattedTglLahir ? ", " + formattedTglLahir : ""
    }</td>
              </tr>
              <tr>
                <td><strong>Alamat</strong></td>
                <td>:</td>
                <td>${data.alamat.substring(0, 50)}${
      data.alamat.length > 50 ? "..." : ""
    }</td>
              </tr>
              <tr>
                <td><strong>No. HP</strong></td>
                <td>:</td>
                <td>${data.no_hp}</td>
              </tr>
            </table>
            
            <div class="qr-preview">
              <div class="qr-placeholder">
                <i class="fas fa-qrcode"></i>
                <p>QR Code</p>
                <small>Scan untuk verifikasi</small>
              </div>
            </div>
          </div>
        </div>
        
        <div class="kartu-footer-preview">
          <div class="ttd-section">
            <div class="ttd-placeholder"></div>
            <p>Kepala Sekolah</p>
          </div>
          <div class="valid-section">
            <p><strong>Berlaku hingga:</strong> 30 Juni 2024</p>
            <p><strong>Tanda Tangan Pemilik:</strong></p>
            <div class="ttd-pemilik"></div>
          </div>
        </div>
      </div>
    `;
  }

  async function submitForm() {
    const submitBtn = kartuForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    submitBtn.disabled = true;

    const formData = {
      nama: document.getElementById("nama").value,
      nis: document.getElementById("nis").value,
      kelas: document.getElementById("kelas").value,
      jurusan: document.getElementById("jurusan").value,
      tempat_lahir: document.getElementById("tempat_lahir").value,
      tanggal_lahir: document.getElementById("tanggal_lahir").value,
      alamat: document.getElementById("alamat").value,
      no_hp: document.getElementById("no_hp").value,
      foto: currentFoto,
    };

    try {
      let fotoUrl = currentFoto;
      if (isOnline && currentFoto) {
        const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: currentFoto }),
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          fotoUrl = uploadResult.url;
        }
      }

      const response = await fetch(`${API_BASE_URL}/siswa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, foto: fotoUrl }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast(result.message || "✅ Kartu berhasil dibuat!", "success");

        setTimeout(() => {
          if (result.pdf_url) {
            window.open(`${window.location.origin}${result.pdf_url}`, "_blank");
          }
        }, 500);

        resetForm();
      } else {
        throw new Error(result.error || "Gagal menyimpan data");
      }
    } catch (error) {
      console.error("Submission error:", error);

      const errorMessage = error.message || "Gagal terhubung ke server";
      showToast(`❌ ${errorMessage}. Menyimpan secara lokal...`, "error");

      saveToLocalStorage(formData);

      isOnline = false;
      updateOnlineStatus();
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  async function generatePDF() {
    const nis = document.getElementById("nis")?.value;

    if (!nis) {
      showToast("Silakan isi NIS terlebih dahulu", "error");
      return;
    }

    try {
      showToast("Mencari data siswa...", "info");

      const searchResponse = await fetch(`${API_BASE_URL}/search?q=${nis}`);
      const searchResult = await searchResponse.json();

      if (searchResult.success && searchResult.data.length > 0) {
        const siswaId = searchResult.data[0].id;
        showToast("Membuat PDF...", "info");

        window.open(`${API_BASE_URL}/siswa/${siswaId}/pdf`, "_blank");
      } else {
        throw new Error("Data siswa tidak ditemukan");
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      showToast("Gagal membuat PDF. Coba lagi nanti.", "error");

      createFallbackPDF();
    }
  }

  async function checkNisAvailability(nis) {
    if (!nis || nis.length < 3) return;

    try {
      const response = await fetch(`${API_BASE_URL}/check-nis/${nis}`);
      const result = await response.json();

      const nisInput = document.getElementById("nis");
      if (result.success) {
        if (!result.available) {
          nisInput.style.borderColor = "#ef4444";
          nisInput.classList.add("error");
          showToast("NIS sudah terdaftar", "warning");
        } else {
          nisInput.style.borderColor = "#10b981";
          nisInput.classList.remove("error");
        }
      }
    } catch (error) {
      console.error("NIS check error:", error);
    }
  }

  async function checkApiConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const result = await response.json();
        console.log("✅ API Connected:", result.status);
        isOnline = true;

        syncOfflineData();
      }
    } catch (error) {
      console.warn("⚠️ API Connection failed, using offline mode");
      isOnline = false;
      updateOnlineStatus();
    }
  }

  async function loadInitialData() {
    try {
      const statsResponse = await fetch(`${API_BASE_URL}/stats`);
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        if (stats.success) {
          updateStatsDisplay(stats.data);
        }
      }
    } catch (error) {
      console.warn("Could not load initial data:", error);
    }
  }

  function setupAdminLink() {
    if (adminLink) {
      const token = localStorage.getItem("admin_token");
      if (token) {
        adminLink.href = "admin/dashboard.html";
        adminLink.innerHTML = '<i class="fas fa-user-cog"></i> Dashboard';
      } else {
        adminLink.href = "admin/login.html";
        adminLink.innerHTML = '<i class="fas fa-sign-in-alt"></i> Admin';
      }
    }
  }

  function saveToLocalStorage(data) {
    try {
      const offlineData = JSON.parse(
        localStorage.getItem("offline_siswa") || "[]"
      );
      offlineData.push({
        ...data,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        synced: false,
      });
      localStorage.setItem("offline_siswa", JSON.stringify(offlineData));

      updateOfflineCounter();

      showToast(
        `📱 Data disimpan offline (Total: ${offlineData.length})`,
        "info"
      );
    } catch (error) {
      console.error("LocalStorage error:", error);
      showToast("Gagal menyimpan data lokal", "error");
    }
  }

  async function syncOfflineData() {
    const offlineData = JSON.parse(
      localStorage.getItem("offline_siswa") || "[]"
    );
    const unsynced = offlineData.filter((item) => !item.synced);

    if (unsynced.length === 0) return;

    showToast(`Menyinkronkan ${unsynced.length} data offline...`, "info");

    let successCount = 0;
    let errorCount = 0;

    for (const item of unsynced) {
      try {
        const response = await fetch(`${API_BASE_URL}/siswa`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });

        if (response.ok) {
          item.synced = true;
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    localStorage.setItem("offline_siswa", JSON.stringify(offlineData));

    updateOfflineCounter();

    if (successCount > 0) {
      showToast(`✅ ${successCount} data berhasil disinkronkan`, "success");
    }
    if (errorCount > 0) {
      showToast(`❌ ${errorCount} data gagal disinkronkan`, "warning");
    }
  }

  function updateStatsDisplay(stats) {
    const statElements = {
      totalSiswa: stats.total_siswa,
      totalCetakan: stats.total_cetakan,
      todaySiswa: stats.today_siswa || 0,
      todayCetakan: stats.today_cetakan || 0,
    };

    for (const [key, value] of Object.entries(statElements)) {
      const element = document.getElementById(key);
      if (element) {
        element.textContent = value;
      }
    }
  }

  function updateOfflineCounter() {
    const offlineData = JSON.parse(
      localStorage.getItem("offline_siswa") || "[]"
    );
    const unsyncedCount = offlineData.filter((item) => !item.synced).length;

    const counterElement = document.getElementById("offlineCounter");
    if (counterElement) {
      if (unsyncedCount > 0) {
        counterElement.textContent = `📱 ${unsyncedCount}`;
        counterElement.style.display = "inline-block";
      } else {
        counterElement.style.display = "none";
      }
    }
  }

  function updateOnlineStatus() {
    const statusElement = document.getElementById("onlineStatus");
    if (statusElement) {
      if (isOnline) {
        statusElement.innerHTML = '<i class="fas fa-wifi"></i> Online';
        statusElement.className = "online";
      } else {
        statusElement.innerHTML = '<i class="fas fa-wifi-slash"></i> Offline';
        statusElement.className = "offline";
      }
    }
  }

  function createFallbackPDF() {
    const data = {
      nama: document.getElementById("nama")?.value || "Nama Siswa",
      nis: document.getElementById("nis")?.value || "NIS123",
      kelas: document.getElementById("kelas")?.value || "Kelas",
      jurusan: document.getElementById("jurusan")?.value || "Jurusan",
    };

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kartu Pelajar - ${data.nama}</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          .card { border: 2px solid #333; padding: 20px; width: 600px; }
          .header { text-align: center; background: #2563eb; color: white; padding: 10px; }
          .content { display: flex; margin: 20px 0; }
          .info { flex: 1; }
          table { width: 100%; }
          td { padding: 5px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>KARTU PELAJAR</h1>
            <h2>SMA NEGERI 1 DIGITAL</h2>
          </div>
          <div class="content">
            <div class="info">
              <table>
                <tr><td><strong>Nama:</strong></td><td>${data.nama}</td></tr>
                <tr><td><strong>NIS:</strong></td><td>${data.nis}</td></tr>
                <tr><td><strong>Kelas:</strong></td><td>${data.kelas}</td></tr>
                <tr><td><strong>Jurusan:</strong></td><td>${
                  data.jurusan
                }</td></tr>
              </table>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <p><em>Kartu ini dibuat secara offline</em></p>
            <p>Tanggal: ${new Date().toLocaleDateString("id-ID")}</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 1000);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  function resetForm() {
    if (kartuForm) {
      kartuForm.reset();
      previewContainer.innerHTML = "";
      currentFoto = null;

      const inputs = kartuForm.querySelectorAll("input, select, textarea");
      inputs.forEach((input) => {
        input.style.borderColor = "#e5e7eb";
        input.classList.remove("error");
      });

      sessionStorage.removeItem("fotoSiswa");
    }
  }

  function showToast(message, type = "info") {
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.style.display = "block";

    setTimeout(() => {
      toast.style.display = "none";
    }, 4000);

    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };
    console.log(`${icons[type] || ""} ${message}`);
  }

  const dynamicStyles = document.createElement("style");
  dynamicStyles.textContent = `
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      max-width: 350px;
      animation: slideIn 0.3s ease;
    }
    
    .toast-success { background: #10b981; }
    .toast-error { background: #ef4444; }
    .toast-warning { background: #f59e0b; }
    .toast-info { background: #3b82f6; }
    
    .online-status {
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
    }
    
    .online { background: #10b981; color: white; }
    .offline { background: #6b7280; color: white; }
    
    .error {
      border-color: #ef4444 !important;
      background-color: #fef2f2 !important;
    }
    
    .error-message {
      color: #ef4444;
      font-size: 12px;
      margin-top: 4px;
      display: none;
    }
    
    .fa-spinner {
      animation: spin 1s linear infinite;
    }
    
    .offline-counter {
      background: #f59e0b;
      color: white;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 12px;
      margin-left: 5px;
      display: none;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .kartu-preview-container {
      font-family: 'Arial', sans-serif;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .kartu-header-preview {
      text-align: center;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      padding: 1rem;
      border-radius: 10px 10px 0 0;
    }
    
    .kartu-header-preview h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: bold;
    }
    
    .kartu-content-preview {
      display: flex;
      gap: 2rem;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .foto-section {
      flex: 1;
      text-align: center;
    }
    
    .foto-preview {
      width: 120px;
      height: 160px;
      object-fit: cover;
      border: 2px solid #ddd;
      border-radius: 5px;
      margin-bottom: 0.5rem;
    }
    
    .foto-label {
      font-size: 0.9rem;
      color: #666;
    }
    
    .data-section {
      flex: 2;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }
    
    .data-table tr {
      border-bottom: 1px solid #eee;
    }
    
    .data-table td {
      padding: 0.4rem 0;
      vertical-align: top;
    }
    
    .data-table td:first-child {
      width: 150px;
      font-weight: 600;
      color: #333;
    }
    
    .qr-preview {
      text-align: center;
      margin-top: 1rem;
    }
    
    .qr-placeholder {
      display: inline-block;
      padding: 1rem;
      border: 2px dashed #ddd;
      border-radius: 10px;
      color: #666;
      text-align: center;
    }
    
    .qr-placeholder i {
      font-size: 3rem;
      margin-bottom: 0.5rem;
      display: block;
    }
    
    .kartu-footer-preview {
      display: flex;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      border-top: 2px solid #eee;
      font-size: 0.9rem;
    }
    
    .ttd-section {
      text-align: center;
    }
    
    .ttd-placeholder {
      width: 150px;
      height: 50px;
      border-bottom: 2px solid #333;
      margin: 0 auto 0.5rem;
    }
    
    .ttd-pemilik {
      width: 150px;
      height: 30px;
      border-bottom: 1px solid #333;
      margin-top: 0.5rem;
    }
    
    .valid-section {
      text-align: right;
    }
    
    @media (max-width: 768px) {
      .kartu-content-preview {
        flex-direction: column;
        gap: 1rem;
      }
      
      .foto-section {
        order: -1;
      }
      
      .kartu-footer-preview {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
      
      .valid-section {
        text-align: center;
      }
    }
  `;
  document.head.appendChild(dynamicStyles);

  const statusIndicator = document.createElement("div");
  statusIndicator.id = "onlineStatus";
  statusIndicator.className = "online-status";
  document.body.appendChild(statusIndicator);

  if (adminLink) {
    const counterSpan = document.createElement("span");
    counterSpan.id = "offlineCounter";
    counterSpan.className = "offline-counter";
    adminLink.appendChild(counterSpan);
  }

  updateOnlineStatus();
  updateOfflineCounter();

  setInterval(() => {
    if (isOnline) {
      syncOfflineData();
    }
  }, 30000);

  console.log("🎉 Frontend setup complete!");
});
