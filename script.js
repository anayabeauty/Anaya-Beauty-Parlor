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

let generatedTokenNumber = "";

document.addEventListener("DOMContentLoaded", () => {
  populateServices();
  listenToParlorStatus();
  listenToProducts();
  listenToGallery();
  listenToChat();
});

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

function orderProduct(productName) {
  const name = prompt("Enter your Name:");
  const phone = prompt("Enter your Phone Number:");
  const address = prompt("Enter Delivery Address:");

  if (name && phone && address) {
    db.ref('orders').push({ productName, customerName: name, phone, address, timestamp: firebase.database.ServerValue.TIMESTAMP });
    const msg = `Hello Anaya Parlor! I want to order:\nProduct: ${productName}\nName: ${name}\nPhone: ${phone}\nAddress: ${address}`;
    window.open(`https://wa.me/923458970591?text=${encodeURIComponent(msg)}`, '_blank');
  }
}

function handleBooking(paymentMethod) {
  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const service = document.getElementById("cust-service").value;

  if (!name || !phone || !service) {
    alert("Please complete all booking fields!");
    return;
  }

  generatedTokenNumber = `#ABP-${Math.floor(10 + Math.random() * 90)}`;
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB');
  const timeStr = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  document.getElementById("pass-name").textContent = name;
  document.getElementById("pass-phone").textContent = phone;
  document.getElementById("pass-service").textContent = service;
  document.getElementById("pass-date").textContent = dateStr;
  document.getElementById("pass-time").textContent = timeStr;
  document.getElementById("token-num").textContent = generatedTokenNumber;

  db.ref('bookings').push({
    token: generatedTokenNumber, name, phone, service, paymentStatus: `50 PKR via ${paymentMethod}`, date: dateStr, time: timeStr
  });

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
  const msg = `Hello Anaya Beauty Parlor!\nI booked an appointment.\nToken: ${generatedTokenNumber}\nName: ${name}\nService: ${service}`;
  window.open(`https://wa.me/923458970591?text=${encodeURIComponent(msg)}`, '_blank');
}

function sendMessage() {
  const input = document.getElementById("chat-msg");
  if (input && input.value.trim() !== "") {
    db.ref('chats').push({ sender: "Customer", text: input.value.trim(), timestamp: firebase.database.ServerValue.TIMESTAMP });
    input.value = "";
  }
}

function listenToChat() {
  db.ref('chats').on('value', (snapshot) => {
    const box = document.getElementById("chat-box");
    if (!box) return;
    box.innerHTML = "";
    if (!snapshot.exists()) return;

    snapshot.forEach((child) => {
      const msg = child.val();
      const isUser = msg.sender === "Customer";
      box.innerHTML += `<div class="msg ${isUser ? 'user' : 'owner'}"><strong>${isUser ? 'You' : 'Owner'}:</strong> ${msg.text}</div>`;
    });
    box.scrollTop = box.scrollHeight;
  });
}
