const API = "https://smart-receipt-tracker-4.onrender.com";

// Always get fresh token
function getToken() {
  return localStorage.getItem("token");
}

// ➕ Add Expense
async function addExpense() {
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
}

// 📊 Load Data
async function loadData() {
  const res = await fetch(API + "/api/receipts", {
    headers: { "Authorization": getToken() }
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

  // Chart
  new Chart(document.getElementById("chart"), {
    type: "pie",
    data: {
      labels: Object.keys(categoryData),
      datasets: [{ data: Object.values(categoryData) }]
    }
  });
}

// 🧾 OCR Scan
async function scanReceipt(event) {
  const file = event.target.files[0];

  document.getElementById("ocrResult").innerText = "Scanning...";

  const result = await Tesseract.recognize(file, "eng");
  const text = result.data.text;

  document.getElementById("ocrResult").innerText = text;

  const amountMatch = text.match(/\d+(\.\d{1,2})?/);
  const amount = amountMatch ? amountMatch[0] : "";

  const merchant = text.split("\n")[0];

  document.getElementById("merchant").value = merchant;
  document.getElementById("amount").value = amount;
}

// 🤖 Auto Payment Simulation
function simulatePayment() {
  const samples = [
    "Paid ₹250 to Zomato",
    "Amazon ₹1200",
    "Uber ₹300"
  ];

  const msg = samples[Math.random() * samples.length | 0];

  document.getElementById("amount").value = msg.match(/\d+/)[0];
  document.getElementById("merchant").value = msg.replace(/[^a-zA-Z ]/g, "");
}

// 📤 Export Excel (🔥 FIXED)
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

    // ✅ Force download
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

// 🚀 Load on start
loadData();