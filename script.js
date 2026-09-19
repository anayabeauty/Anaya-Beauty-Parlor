const firebaseConfig = {
  apiKey: "AIzaSyDzTE1SKw75r4RwWq2KtP-C9F_iipgJDtc",
  authDomain: "anaya-beauty-parlor.firebaseapp.com",
  databaseURL: "https://anaya-beauty-parlor-default-rtdb.firebaseio.com",
  projectId: "anaya-beauty-parlor",
  storageBucket: "anaya-beauty-parlor.firebasestorage.app",
  messagingSenderId: "191638677242",
  appId: "1:191638677242:web:fa452a7801633617668b43",
  measurementId: "G-K2S36VDKNN"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const servicesData = [
  { name: "Basic Facial", price: "1,500 PKR" },
  { name: "Whitening Facial", price: "2,000 PKR" },
  { name: "Gold Facial", price: "3,000 PKR" },
  { name: "Acne Facial", price: "3,000 - 4,000 PKR" },
  { name: "HydraFacial", price: "6,000 - 7,000 PKR" },
  { name: "Advanced HydraFacial", price: "7,000 PKR" },
  { name: "Haircut", price: "500 - 1,200 PKR" },
  { name: "Hair Styling", price: "500 - 1,000 PKR" },
  { name: "Blow Dry", price: "500 - 1,000 PKR" },
  { name: "Party Makeup", price: "3,500 - 5,000 PKR" },
  { name: "Bridal Makeup", price: "15,000 - 25,000 PKR" },
  { name: "Manicure & Pedicure", price: "2,000 PKR" },
  { name: "Eyebrows & Upperlip Threading", price: "200 PKR" },
  { name: "Full Body Waxing", price: "3,500 PKR" }
];

let selectedPaymentMethod = "";
let generatedTokenNumber = "";

document.addEventListener("DOMContentLoaded", () => {
  populateServices();
  listenToParlorStatus();
  listenToProducts();
  listenToGallery();
});

// Login / Registration Handling
function handleCustomerLogin() {
  const name = document.getElementById("user-name").value.trim();
  const pass = document.getElementById("user-pass").value;
  const confirmPass = document.getElementById("user-confirm-pass").value;

  if (!name || !pass || !confirmPass) {
    alert("Please fill in all registration fields.");
    return;
  }

  if (pass !== confirmPass) {
    alert("Passwords do not match. Please try again.");
    return;
  }

  document.getElementById("auth-modal").style.display = "none";
  document.getElementById("cust-name").value = name;
}

function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

function populateServices() {
  const list = document.getElementById("services-list");
  const select = document.getElementById("cust-service");
  if (list) list.innerHTML = "";
  if (select) select.innerHTML = `<option value="">-- Select Service --</option>`;

  servicesData.forEach(s => {
    if (list) {
      list.innerHTML += `
        <li class="service-pill-item">
          <span class="service-name">${s.name}</span>
          <span class="service-price-badge">${s.price}</span>
        </li>`;
    }
    if (select) {
      select.innerHTML += `<option value="${s.name}">${s.name} (${s.price})</option>`;
    }
  });
}

function listenToParlorStatus() {
  db.ref('parlorStatus').on('value', (snapshot) => {
    const badge = document.getElementById("status-badge");
    if (!badge) return;
    if (snapshot.val()) {
      badge.textContent = "● OPEN TODAY";
      badge.className = "badge open";
    } else {
      badge.textContent = "● CLOSED TODAY";
      badge.className = "badge closed";
    }
  });
}

function listenToProducts() {
  db.ref('products').on('value', (snapshot) => {
    const container = document.getElementById('products-list');
    if (!container) return;
    container.innerHTML = snapshot.exists() ? "" : `<p style="text-align:center; color:#777; grid-column: 1/-1;">No products available right now.</p>`;

    snapshot.forEach((child) => {
      const p = child.val();
      container.innerHTML += `
        <div class="product-card">
          <img src="${p.img}" alt="${p.name}">
          <h3>${p.name}</h3>
          <p><strong>Price:</strong> ${p.price} PKR</p>
          <button onclick="orderProduct('${p.name}')" class="btn" style="background:#25d366; margin-top:8px;">Order via WhatsApp</button>
        </div>`;
    });
  });
}

function listenToGallery() {
  db.ref('gallery').on('value', (snapshot) => {
    const container = document.getElementById('gallery-list');
    if (!container) return;
    container.innerHTML = snapshot.exists() ? "" : `<p style="text-align:center; color:#777; grid-column: 1/-1;">No photo updates added yet.</p>`;

    snapshot.forEach((child) => {
      const g = child.val();
      container.innerHTML += `
        <div class="gallery-card">
          <img src="${g.img}" alt="${g.title}">
          <p style="margin-top:6px; font-weight:600; color:#ff1493;">${g.title}</p>
        </div>`;
    });
  });
}

function showPaymentScreen(method) {
  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const service = document.getElementById("cust-service").value;

  if (!name || !phone || !service) {
    alert("Please complete name, phone, and service selection first!");
    return;
  }

  selectedPaymentMethod = method;
  document.getElementById("payment-method-title").textContent = `${method} Payment Instructions`;
  document.getElementById("payment-step").classList.remove("hidden");
}

async function submitTransactionVerification() {
  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const service = document.getElementById("cust-service").value;
  const trxId = document.getElementById("trx-id").value.trim();
  const fileInput = document.getElementById("trx-file");

  if (!trxId && !fileInput.files[0]) {
    alert("Please provide either a Transaction ID or upload a payment screenshot.");
    return;
  }

  let screenshotBase64 = "";
  if (fileInput.files[0]) {
    screenshotBase64 = await convertFileToBase64(fileInput.files[0]);
  }

  generatedTokenNumber = `#ABP-${Math.floor(10 + Math.random() * 90)}`;
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB');

  document.getElementById("pass-name").textContent = name;
  document.getElementById("pass-phone").textContent = phone;
  document.getElementById("pass-service").textContent = service;
  document.getElementById("pass-trx").textContent = trxId || "Screenshot Uploaded";
  document.getElementById("token-num").textContent = generatedTokenNumber;

  db.ref('bookings').push({
    token: generatedTokenNumber,
    name,
    phone,
    service,
    paymentMethod: selectedPaymentMethod,
    trxId: trxId || "Attached",
    screenshot: screenshotBase64,
    status: "Pending Verification",
    date: dateStr
  });

  document.getElementById("payment-step").classList.add("hidden");
  document.getElementById("token-result").classList.remove("hidden");
}

function downloadAppointmentPass() {
  const container = document.getElementById("appointment-card");
  if (!container) return;
  html2canvas(container).then(canvas => {
    const link = document.createElement("a");
    link.download = `Pass-${generatedTokenNumber}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });
}

function sendWhatsAppConfirmation() {
  const name = document.getElementById("pass-name").textContent;
  const service = document.getElementById("pass-service").textContent;
  const trx = document.getElementById("pass-trx").textContent;
  const msg = `Hello Anaya Beauty Parlor!\nI completed payment for my appointment.\nToken: ${generatedTokenNumber}\nName: ${name}\nService: ${service}\nTrx ID: ${trx}`;
  window.open(`https://wa.me/923458970591?text=${encodeURIComponent(msg)}`, '_blank');
}
