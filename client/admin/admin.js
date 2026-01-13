document.addEventListener("DOMContentLoaded", function () {
  const API_BASE_URL = "http://localhost:3000/api";

  const loadingOverlay = document.getElementById("loadingOverlay");
  const logoutBtn = document.getElementById("logoutBtn");
  const confirmLogoutBtn = document.getElementById("confirmLogout");
  const logoutModal = document.getElementById("logoutModal");
  const closeModalBtns = document.querySelectorAll(".close-modal");
  const usernameDisplay = document.getElementById("usernameDisplay");
  const sidebarToggle = document.querySelector(".sidebar-toggle");
  const sidebar = document.querySelector(".admin-sidebar");
  const statsGrid = document.getElementById("statsGrid");
  const recentSiswaTable = document.getElementById("recentSiswaTable");
  const recentCetakanTable = document.getElementById("recentCetakanTable");
  const siswaCountBadge = document.getElementById("siswaCount");
  const notificationCount = document.getElementById("notificationCount");
  const toast = document.getElementById("toast");

  let currentUser = null;

  function showToast(message, type = "info", duration = 4000) {
    if (!toast) {
      console.error("Toast element not found!");
      console.log(`${type}: ${message}`);
      return;
    }

    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = "block";

    setTimeout(() => {
      if (toast) {
        toast.style.display = "none";
      }
    }, duration);

    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };
    console.log(`${icons[type] || ""} ${message}`);
  }

  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateString || "-";
    }
  }

  function clearSession() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("last_login");
  }

  function redirectToLogin() {
    window.location.href = "login.html";
  }

  function checkAuth() {
    const token = localStorage.getItem("admin_token");
    const user = localStorage.getItem("admin_user");

    if (!token || !user) {
      showToast("Silakan login terlebih dahulu", "error");
      redirectToLogin();
      return;
    }

    try {
      currentUser = JSON.parse(user);
      updateUserDisplay();

      verifyToken(token);
    } catch (error) {
      console.error("Auth error:", error);
      showToast("Session tidak valid", "error");
      clearSession();
      redirectToLogin();
    }
  }

  async function verifyToken(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Token invalid");
      }

      console.log("✅ Token verified");
      return true;
    } catch (error) {
      console.error("Token verification failed:", error);
      showToast("Session telah kadaluarsa", "error");
      clearSession();
      redirectToLogin();
      return false;
    }
  }

  function updateUserDisplay() {
    if (currentUser && usernameDisplay) {
      usernameDisplay.textContent =
        currentUser.nama_lengkap || currentUser.username;

      const avatar = document.querySelector(".user-avatar");
      if (avatar) {
        const initial = currentUser.nama_lengkap
          ? currentUser.nama_lengkap.charAt(0).toUpperCase()
          : currentUser.username.charAt(0).toUpperCase();

        avatar.innerHTML = `<span>${initial}</span>`;
      }
    }
  }

  async function loadDashboardData() {
    try {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        throw new Error("No authentication token");
      }

      const statsResponse = await fetch(`${API_BASE_URL}/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        updateStats(stats.data);
      } else {
        console.warn("Failed to load stats");
      }

      const dashboardResponse = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (dashboardResponse.ok) {
        const dashboard = await dashboardResponse.json();
        updateRecentData(dashboard.data);
      } else {
        console.warn("Failed to load dashboard data");
      }

      const siswaResponse = await fetch(`${API_BASE_URL}/siswa`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (siswaResponse.ok) {
        const siswa = await siswaResponse.json();
        if (siswaCountBadge) {
          siswaCountBadge.textContent = siswa.meta?.total || 0;
        }
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      showToast("Gagal memuat data dashboard", "error");
    } finally {
      if (loadingOverlay) {
        loadingOverlay.style.display = "none";
      }
    }
  }

  function updateStats(stats) {
    if (!statsGrid) return;

    const statCards = [
      {
        id: "totalSiswa",
        value: stats.total_siswa || 0,
        icon: "users",
        label: "Total Siswa",
      },
      {
        id: "totalCetakan",
        value: stats.total_cetakan || 0,
        icon: "print",
        label: "Total Cetakan",
      },
      {
        id: "todaySiswa",
        value: stats.today_siswa || 0,
        icon: "calendar-day",
        label: "Siswa Hari Ini",
      },
      {
        id: "todayCetakan",
        value: stats.today_cetakan || 0,
        icon: "print",
        label: "Cetakan Hari Ini",
      },
      {
        id: "totalAdmin",
        value: stats.total_admin || 0,
        icon: "user-shield",
        label: "Admin Aktif",
      },
    ];

    statsGrid.innerHTML = "";

    statCards.forEach((stat) => {
      const card = document.createElement("div");
      card.className = "stat-card";
      card.innerHTML = `
        <div class="stat-icon">
          <i class="fas fa-${stat.icon}"></i>
        </div>
        <div class="stat-info">
          <h3>${formatNumber(stat.value)}</h3>
          <p>${stat.label}</p>
        </div>
      `;
      statsGrid.appendChild(card);
    });

    if (stats.per_kelas && Object.keys(stats.per_kelas).length > 0) {
      const kelasCard = document.createElement("div");
      kelasCard.className = "stat-card";
      kelasCard.innerHTML = `
        <div class="stat-icon">
          <i class="fas fa-chart-pie"></i>
        </div>
        <div class="stat-info">
          <h3>${Object.keys(stats.per_kelas).length}</h3>
          <p>Jumlah Kelas</p>
        </div>
      `;
      statsGrid.appendChild(kelasCard);
    }
  }

  function updateRecentData(data) {
    if (recentSiswaTable && data.recent_siswa) {
      const tbody = recentSiswaTable.querySelector("tbody");
      if (tbody) {
        tbody.innerHTML = "";

        if (data.recent_siswa.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" class="text-center">Belum ada data siswa</td>
            </tr>
          `;
        } else {
          data.recent_siswa.forEach((siswa) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${siswa.nama || "-"}</td>
              <td>${siswa.nis || "-"}</td>
              <td>${siswa.kelas || "-"}</td>
              <td>${formatDate(siswa.tanggal_dibuat)}</td>
              <td>
                <button class="btn-action view" onclick="viewSiswa(${
                  siswa.id
                })">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action print" onclick="printKartu(${
                  siswa.id
                })">
                  <i class="fas fa-print"></i>
                </button>
              </td>
            `;
            tbody.appendChild(row);
          });
        }
      }
    }

    if (recentCetakanTable && data.recent_cetakan) {
      const tbody = recentCetakanTable.querySelector("tbody");
      if (tbody) {
        tbody.innerHTML = "";

        if (data.recent_cetakan.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="4" class="text-center">Belum ada data cetakan</td>
            </tr>
          `;
        } else {
          data.recent_cetakan.forEach((cetak) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${cetak.siswa_nama || "Unknown"}</td>
              <td>${cetak.siswa_nis || "Unknown"}</td>
              <td><span class="badge ${cetak.jenis_cetak || "digital"}">${
              cetak.jenis_cetak || "digital"
            }</span></td>
              <td>${formatDate(cetak.tanggal_cetak)}</td>
            `;
            tbody.appendChild(row);
          });
        }
      }
    }

    updateSystemInfo(data);
  }

  function updateSystemInfo(data) {
    const lastUpdate = document.getElementById("lastUpdate");
    if (lastUpdate) {
      lastUpdate.textContent = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const memoryUsage = document.getElementById("memoryUsage");
    if (memoryUsage) {
      const usage = Math.floor(Math.random() * 60) + 20;
      memoryUsage.textContent = `${usage}%`;
    }

    const systemVersion = document.getElementById("systemVersion");
    if (systemVersion) {
      systemVersion.textContent = "2.0.0";
    }
  }

  function setupEventListeners() {
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (logoutModal) {
          logoutModal.style.display = "flex";
        }
      });
    }

    if (confirmLogoutBtn) {
      confirmLogoutBtn.addEventListener("click", function () {
        clearSession();
        showToast("Berhasil logout", "success");
        setTimeout(() => {
          redirectToLogin();
        }, 1000);
      });
    }

    closeModalBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        if (logoutModal) {
          logoutModal.style.display = "none";
        }
      });
    });

    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener("click", function () {
        sidebar.classList.toggle("collapsed");
        const adminContent = document.querySelector(".admin-content");
        if (adminContent) {
          adminContent.classList.toggle("expanded");
        }
      });
    }

    window.addEventListener("click", function (e) {
      if (logoutModal && e.target === logoutModal) {
        logoutModal.style.display = "none";
      }
    });
  }

  window.viewSiswa = function (id) {
    window.location.href = `siswa-detail.html?id=${id}`;
  };

  window.printKartu = function (id) {
    if (id) {
      window.open(`${API_BASE_URL}/siswa/${id}/pdf`, "_blank");
      showToast("Membuka PDF untuk dicetak", "info");
    } else {
      showToast("ID siswa tidak valid", "error");
    }
  };

  window.showSettings = function () {
    window.location.href = "settings.html";
  };

  function initDashboard() {
    console.log("🚀 Initializing Admin Dashboard...");

    checkAuth();

    setupEventListeners();

    setTimeout(() => {
      loadDashboardData();
    }, 500);

    if (currentUser) {
      console.log(`👋 Welcome, ${currentUser.username}!`);
    }
  }

  initDashboard();
});
