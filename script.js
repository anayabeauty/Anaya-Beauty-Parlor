// ==========================================
// 1. FIREBASE INITIALIZATION
// ==========================================
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==========================================
// 2. PARLOR SERVICES LIST (PRICES)
// ==========================================
const servicesData = [
  { name: "Basic Facial", price: "1,500 PKR" },
  { name: "Whitening Facial", price: "2,000 PKR" },
  { name: "Gold Facial", price: "3,000 PKR" },
  { name: "Acne Facial", price: "3,000 - 4,000 PKR" },
  { name: "HydraFacial", price: "6,000 - 7,000 PKR" },
  { name: "Advanced HydraFacial", price: "7,000 PKR" },
  { name: "Haircut", price: "500 - 1,200 PKR" },
  { name: "Hair Styling", price: "500 - 1,000 PKR" },
  { name: "Blow Dry", price: "500 - 1,000 PKR" }
];

let generatedTokenNumber = "";

// Initialize App Data on Page Load
document.addEventListener("DOMContentLoaded", () => {
  populateServices();
  listenToParlorStatus();
  listenToProducts();
  listenToGallery();
  listenToChat();
});

// Switch Between Navigation Tabs
function switchTab(tabId) {
  const allContents = document.querySelectorAll('.tab-content');
  allContents.forEach(content => content.classList.remove('active'));

  const activeTab = document.getElementById(`${tabId}-tab`);
  if (activeTab) {
    activeTab.classList.add('active');
  }
}

// Render Services into Price List & Dropdown Form
function populateServices() {
  const servicesList = document.getElementById("services-list");
  const serviceSelect = document.getElementById("cust-service");

  if (servicesList) servicesList.innerHTML = "";
  if (serviceSelect) serviceSelect.innerHTML = `<option value="">-- Select Service --</option>`;

  servicesData.forEach(s => {
    // Populate Price List Tab
    if (servicesList) {
      servicesList.innerHTML += `
        <li>
          <span class="service-name">${s.name}</span>
          <span class="price-tag">${s.price}</span>
        </li>
      `;
    }

    // Populate Booking Dropdown
    if (serviceSelect) {
      serviceSelect.innerHTML += `<option value="${s.name}">${s.name} (${s.price})</option>`;
    }
  });
}

// ==========================================
// 3. REAL-TIME DATABASE LISTENERS
// ==========================================

// Monitor Parlor Open/Closed Status
function listenToParlorStatus() {
  db.ref('parlorStatus').on('value', (snapshot) => {
    const isOpen = snapshot.val();
    const badge = document.getElementById("status-badge");
    if (!badge) return;

    if (isOpen) {
      badge.textContent = "● OPEN TODAY";
      badge.className = "badge open";
    } else {
      badge.textContent = "● CLOSED TODAY";
      badge.className = "badge closed";
    }
  });
}

// Fetch & Render Products Uploaded by Owner
function listenToProducts() {
  db.ref('products').on('value', (snapshot) => {
    const container = document.getElementById('products-list');
    if (!container) return;
    container.innerHTML = "";

    if (!snapshot.exists()) {
      container.innerHTML = `<p style="text-align:center; color:#777; font-size:0.9rem;">No products available right now.</p>`;
      return;
    }

    snapshot.forEach((child) => {
      const p = child.val();
      container.innerHTML += `
        <div style="border: 1px solid #ffb6c1; padding: 12px; border-radius: 10px; margin-bottom: 12px; background: rgba(255,255,255,0.9);">
          <img src="${p.img}" style="width:100%; height:160px; object-fit:cover; border-radius:8px;" onerror="this.src='https://via.placeholder.com/300x160?text=Product+Image'">
          <h3 style="color:#c71585; margin-top:8px; font-size:1.1rem;">${p.name}</h3>
          <p style="font-weight:bold; color:#333; margin: 4px 0 8px 0;">Price: ${p.price} PKR</p>
          <button onclick="orderProduct('${p.name}')" class="btn" style="background:#25d366; width:100%;">🛒 Buy / Order via WhatsApp</button>
        </div>
      `;
    });
  });
}

// Fetch & Render Gallery Uploads
function listenToGallery() {
  db.ref('gallery').on('value', (snapshot) => {
    const container = document.getElementById('gallery-list');
    if (!container) return;
    container.innerHTML = "";

    if (!snapshot.exists()) {
      container.innerHTML = `<p style="text-align:center; color:#777; font-size:0.9rem;">No photo updates added yet.</p>`;
      return;
    }

    snapshot.forEach((child) => {
      const g = child.val();
      container.innerHTML += `
        <div style="margin-bottom: 15px; border:1px solid #ffb6c1; padding:8px; border-radius:10px; background:white;">
          <img src="${g.img}" style="width:100%; height:200px; object-fit:cover; border-radius:8px;" onerror="this.src='https://via.placeholder.com/300x200?text=Gallery+Image'">
          <p style="text-align:center; font-weight:600; color:#c71585; margin-top:6px; font-size:0.9rem;">${g.title}</p>
        </div>
      `;
    });
  });
}

// ==========================================
// 4. PRODUCT ORDERING SYSTEM
// ==========================================
function orderProduct(productName) {
  const name = prompt("Enter your Full Name:");
  if (!name) return;
  const phone = prompt("Enter your Phone Number:");
  if (!phone) return;
  const address = prompt("Enter your Complete Delivery Address:");
  if (!address) return;

  // Push order data into Firebase Realtime Database
  db.ref('orders').push({
    productName: productName,
    customerName: name,
    phone: phone,
    address: address,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });

  // Open Direct WhatsApp Chat to Owner
  const parlorWhatsApp = "923000000000"; // Replace with your actual phone number
  const msg = `Hello Anaya Beauty Parlor! I would like to order:\n*Product:* ${productName}\n*Customer Name:* ${name}\n*Phone:* ${phone}\n*Delivery Address:* ${address}`;
  
  window.open(`https://wa.me/${parlorWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ==========================================
// 5. APPOINTMENT BOOKING & TOKEN PASS
// ==========================================
function handleBooking(paymentMethod) {
  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const service = document.getElementById("cust-service").value;

  if (!name || !phone || !service) {
    alert("Please fill in all your booking details first!");
    return;
  }

  // Generate Token Number
  const randomNum = Math.floor(10 + Math.random() * 90);
  generatedTokenNumber = `#ABP-${randomNum}`;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB');
  const timeStr = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Update Pass Display Fields
  document.getElementById("pass-name").textContent = name;
  document.getElementById("pass-phone").textContent = phone;
  document.getElementById("pass-service").textContent = service;
  document.getElementById("pass-date").textContent = dateStr;
  document.getElementById("pass-time").textContent = timeStr;
  document.getElementById("token-num").textContent = generatedTokenNumber;

  // Save Booking to Firebase
  db.ref('bookings').push({
    token: generatedTokenNumber,
    name: name,
    phone: phone,
    service: service,
    paymentStatus: `50 PKR via ${paymentMethod}`,
    date: dateStr,
    time: timeStr
  });

  // Display Generated Pass
  document.getElementById("token-result").classList.remove("hidden");
  alert(`Please transfer 50 PKR Advance Token Fee via ${paymentMethod} to complete your booking!`);
}

// Download Appointment Pass as PNG Image
function downloadAppointmentPass() {
  const passContainer = document.getElementById("appointment-card");
  if (!passContainer) return;

  html2canvas(passContainer, { scale: 2 }).then(canvas => {
    const link = document.createElement("a");
    link.download = `Anaya-Parlor-Pass-${generatedTokenNumber}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

// Confirm Booking Pass via WhatsApp
function sendWhatsAppConfirmation() {
  const name = document.getElementById("pass-name").textContent;
  const phone = document.getElementById("pass-phone").textContent;
  const service = document.getElementById("pass-service").textContent;
  const date = document.getElementById("pass-date").textContent;
  const time = document.getElementById("pass-time").textContent;

  const parlorWhatsApp = "923000000000"; // Replace with your actual phone number
  const msg = `Hello Anaya Beauty Parlor!\nI have booked an appointment.\n\n🎟️ *Token Number:* ${generatedTokenNumber}\n👤 *Name:* ${name}\n📞 *Phone:* ${phone}\n💅 *Service:* ${service}\n📅 *Date:* ${date} at ${time}\n💳 *Payment:* Paid 50 PKR Advance Token Fee`;

  window.open(`https://wa.me/${parlorWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ==========================================
// 6. LIVE CHAT SYSTEM
// ==========================================
function sendMessage() {
  const input = document.getElementById("chat-msg");
  if (!input) return;
  const message = input.value.trim();

  if (message !== "") {
    db.ref('chats').push({
      sender: "Customer",
      text: message,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    input.value = "";
  }
}

function listenToChat() {
  db.ref('chats').on('value', (snapshot) => {
    const chatContainer = document.getElementById("chat-box");
    if (!chatContainer) return;
    
    chatContainer.innerHTML = "";
    if (!snapshot.exists()) return;

    snapshot.forEach((child) => {
      const msg = child.val();
      const isUser = msg.sender === "Customer";
      const msgClass = isUser ? "user" : "owner";
      
      chatContainer.innerHTML += `
        <div class="msg ${msgClass}">
          <strong>${isUser ? 'You' : 'Owner'}:</strong> ${msg.text}
        </div>
      `;
    });

    // Auto-scroll to bottom message
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });
}
