const API = "https://smart-receipt-tracker-4.onrender.com";

// 📊 Chart instance (FIX for chart refresh bug)
let chartInstance = null;

// 🔐 Signup
async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(API + "/api/signup", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email, password })
    });

    const text = await res.text();
    alert(text);

    if (res.ok) window.location = "login.html";

  } catch (err) {
    console.error(err);
    alert("Signup error");
  }
}

// 🔑 Login
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(API + "/api/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      window.location = "index.html";
    } else {
      alert("Login failed");
    }

  } catch (err) {
    console.error(err);
    alert("Login error");
  }
}

// 🔐 Token helper
function getToken() {
  return localStorage.getItem("token");
}

// ➕ Add Expense
async function addExpense() {
  try {
    await fetch(API + "/api/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": getToken()
      },
      body: JSON.stringify({
        merchant: document.getElementById("merchant").value,
        amount: document.getElementById("amount").value
      })
    });

    loadData();

  } catch (err) {
    console.error(err);
    alert("Error adding expense");
  }
}

// 📊 Load Data + Analysis
async function loadData() {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(API + "/api/receipts", {
      headers: { "Authorization": token }
    });

    const data = await res.json();

    let total = 0;
    let html = "";
    let categoryData = {};

    data.forEach(r => {
      total += Number(r.amount);

      categoryData[r.category] =
        (categoryData[r.category] || 0) + Number(r.amount);

      html += `<tr>
        <td>${r.merchant}</td>
        <td>${r.amount}</td>
        <td>${r.category}</td>
        <td>${new Date(r.date).toLocaleString()}</td>
      </tr>`;
    });

    document.getElementById("table").innerHTML = html;
    document.getElementById("total").innerText = total;

    // 📊 FIXED CHART (IMPORTANT)
    const ctx = document.getElementById("chart");

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: Object.keys(categoryData),
        datasets: [{
          data: Object.values(categoryData)
        }]
      }
    });

  } catch (err) {
    console.error(err);
    alert("Error loading data");
  }
}

// 🧾 OCR Scan
async function scanReceipt(event) {
  const file = event.target.files[0];

  document.getElementById("ocrResult").innerText = "Scanning...";

  const result = await Tesseract.recognize(file, "eng");
  const text = result.data.text;

  document.getElementById("ocrResult").innerText = text;

  const amountMatch = text.match(/\d+(\.\d{1,2})?/);
  document.getElementById("amount").value = amountMatch ? amountMatch[0] : "";

  document.getElementById("merchant").value = text.split("\n")[0];
}

// 🤖 Auto Fill
function simulatePayment() {
  const samples = [
    "Paid ₹250 to Zomato",
    "Amazon ₹1200",
    "Uber ₹300"
  ];

  const msg = samples[Math.floor(Math.random() * samples.length)];

  document.getElementById("amount").value = msg.match(/\d+/)[0];
  document.getElementById("merchant").value = msg.replace(/[^a-zA-Z ]/g, "");
}

// 📤 Export Excel (FIXED DOWNLOAD)
async function exportExcel() {
  try {
    const token = getToken();

    if (!token) {
      alert("Please login first");
      return;
    }

    const res = await fetch(API + "/api/export", {
      method: "GET",
      headers: {
        "Authorization": token
      }
    });

    if (!res.ok) {
      alert("Export failed");
      return;
    }

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "receipts.xlsx";

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
    alert("Download error");
  }
}

// 🚀 Auto load dashboard
if (window.location.pathname.includes("index.html")) {
  loadData();
}