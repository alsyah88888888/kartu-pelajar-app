document.addEventListener("DOMContentLoaded", function () {
  const API_BASE_URL = "http://localhost:3000/api";

  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const loginButton = document.getElementById("loginButton");
  const usernameError = document.getElementById("usernameError");
  const passwordError = document.getElementById("passwordError");
  const toast = document.getElementById("toast");

  togglePasswordBtn.addEventListener("click", function () {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);

    const icon = this.querySelector("i");
    if (type === "text") {
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
      showToast("Password ditampilkan", "info", 2000);
    } else {
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });

  function validateForm() {
    let isValid = true;

    usernameError.textContent = "";
    usernameError.classList.remove("show");
    usernameInput.classList.remove("error");

    passwordError.textContent = "";
    passwordError.classList.remove("show");
    passwordInput.classList.remove("error");

    if (!usernameInput.value.trim()) {
      usernameError.textContent = "Username harus diisi";
      usernameError.classList.add("show");
      usernameInput.classList.add("error");
      isValid = false;
    } else if (usernameInput.value.length < 3) {
      usernameError.textContent = "Username minimal 3 karakter";
      usernameError.classList.add("show");
      usernameInput.classList.add("error");
      isValid = false;
    }

    if (!passwordInput.value.trim()) {
      passwordError.textContent = "Password harus diisi";
      passwordError.classList.add("show");
      passwordInput.classList.add("error");
      isValid = false;
    } else if (passwordInput.value.length < 6) {
      passwordError.textContent = "Password minimal 6 karakter";
      passwordError.classList.add("show");
      passwordInput.classList.add("error");
      isValid = false;
    }

    return isValid;
  }

  function setLoading(isLoading) {
    if (isLoading) {
      loginButton.classList.add("loading");
      loginButton.disabled = true;
      usernameInput.disabled = true;
      passwordInput.disabled = true;
      togglePasswordBtn.disabled = true;
    } else {
      loginButton.classList.remove("loading");
      loginButton.disabled = false;
      usernameInput.disabled = false;
      passwordInput.disabled = false;
      togglePasswordBtn.disabled = false;
    }
  }

  function showToast(message, type = "info", duration = 4000) {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = "block";

    setTimeout(() => {
      toast.style.display = "none";
    }, duration);

    console.log(`${type.toUpperCase()}: ${message}`);
  }

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const credentials = {
      username: usernameInput.value.trim(),
      password: passwordInput.value,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast("✅ Login berhasil! Mengalihkan...", "success");

        localStorage.setItem("admin_token", result.token);
        localStorage.setItem("admin_user", JSON.stringify(result.user));
        localStorage.setItem("last_login", new Date().toISOString());

        console.log("Login successful:", result.user);

        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);
      } else {
        throw new Error(result.error || "Login gagal");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.name === "TypeError" || error.message.includes("Network")) {
        showToast(
          "❌ Tidak dapat terhubung ke server. Periksa koneksi internet.",
          "error"
        );
      } else {
        showToast(`❌ ${error.message}`, "error");
      }

      passwordInput.value = "";
      passwordInput.focus();
    } finally {
      setLoading(false);
    }
  });

  usernameInput.focus();

  checkExistingSession();

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "Enter") {
      loginForm.requestSubmit();
    }

    if (e.key === "Escape") {
      loginForm.reset();
      usernameInput.focus();
    }
  });

  function checkExistingSession() {
    const token = localStorage.getItem("admin_token");
    const user = localStorage.getItem("admin_user");

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        const lastLogin = localStorage.getItem("last_login");

        if (lastLogin) {
          const loginTime = new Date(lastLogin);
          const now = new Date();
          const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

          if (hoursSinceLogin < 24) {
            console.log("Session masih valid, redirecting...");
            showToast(`Welcome back, ${userData.username}!`, "info", 2000);

            setTimeout(() => {
              window.location.href = "dashboard.html";
            }, 2000);
          } else {
            clearSession();
            showToast(
              "Session telah kadaluarsa, silakan login kembali",
              "info"
            );
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
        clearSession();
      }
    }
  }

  function clearSession() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("last_login");
  }

  async function testApiConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        console.log("✅ API connected");
      }
    } catch (error) {
      console.warn("⚠️ API connection failed");
      showToast("Mode offline: Beberapa fitur mungkin terbatas", "info", 5000);
    }
  }

  testApiConnection();
});
