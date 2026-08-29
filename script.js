// Firebase Configuration
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

// Initialize Firebase Realtime Database
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Navigation Tab Switcher
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(tabName + '-tab').classList.add('active');
}

// 1. Sync Open/Close Status (With "TODAY" display)
db.ref('parlorStatus').on('value', (snapshot) => {
  const isOpen = snapshot.val();
  const badge = document.getElementById('status-badge');
  if (isOpen) {
    badge.textContent = "● OPEN TODAY";
    badge.className = "badge open";
  } else {
    badge.textContent = "● CLOSED TODAY";
    badge.className = "badge closed";
  }
});

// 2. Fetch Services & Prices Live
db.ref('services').on('value', (snapshot) => {
  const servicesList = document.getElementById('services-list');
  const serviceSelect = document.getElementById('cust-service');
  servicesList.innerHTML = "";
  serviceSelect.innerHTML = '<option value="">-- Select Service --</option>';

  snapshot.forEach((child) => {
    const s = child.val();
    servicesList.innerHTML += `<li><span>${s.name}</span> <strong>${s.price} PKR</strong></li>`;
    serviceSelect.innerHTML += `<option value="${s.name}">${s.name} (${s.price} PKR)</option>`;
  });
});

// 3. Fetch Products Live
db.ref('products').on('value', (snapshot) => {
  const container = document.getElementById('products-list');
  container.innerHTML = "";
  snapshot.forEach((child) => {
    const p = child.val();
    container.innerHTML += `
      <div class="product-card">
        <img src="${p.image}" alt="${p.name}">
        <h4>${p.name}</h4>
        <p><strong>${p.price} PKR</strong></p>
      </div>`;
  });
});

// 4. Fetch Gallery Photos
db.ref('gallery').on('value', (snapshot) => {
  const container = document.getElementById('gallery-list');
  container.innerHTML = "";
  snapshot.forEach((child) => {
    container.innerHTML += `<div class="gallery-card"><img src="${child.val()}"></div>`;
  });
});

// 5. Daily Token Booking Logic (Max 10 Tokens Per Day)
function handleBooking(gateway) {
  const name = document.getElementById('cust-name').value;
  const phone = document.getElementById('cust-phone').value;
  const service = document.getElementById('cust-service').value;

  if (!name || !phone || !service) {
    alert("Please fill in all details before paying.");
    return;
  }

  db.ref('bookingCounter').transaction((counterData) => {
    let day = counterData ? counterData.day : 1;
    let dailyIndex = counterData ? counterData.index : 0;
    const lastDate = counterData ? counterData.lastDate : "";
    const today = new Date().toDateString();

    if (lastDate !== today) {
      if (lastDate !== "") day += 1;
      dailyIndex = 0;
    }

    if (dailyIndex >= 10) {
      alert("Today's bookings are full (10 tokens limit reached).");
      return;
    }

    const tokenNum = (day * 10) + dailyIndex;
    return { day: day, index: dailyIndex + 1, lastDate: today, lastToken: tokenNum };
  }, (error, committed, snapshot) => {
    if (committed) {
      const tokenNum = snapshot.val().lastToken;

      db.ref('bookings').push({
        token: tokenNum,
        name: name,
        phone: phone,
        service: service,
        paymentStatus: "Paid 50 PKR (" + gateway + ")",
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });

      document.getElementById('token-num').textContent = tokenNum;
      document.getElementById('token-result').classList.remove('hidden');

      const walletNum = "03001234567";
      window.location.href = gateway === 'JazzCash'
        ? `intent://pay?phone=${walletNum}&amount=50#Intent;scheme=jazzcash;package=com.techlogix.mobilinkcustomer;end`
        : `easypaisa://pay?phone=${walletNum}&amount=50`;
    }
  });
}

// 6. Realtime Live Chat
function sendMessage() {
  const input = document.getElementById('chat-msg');
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

db.ref('chats').on('value', (snapshot) => {
  const chatContainer = document.getElementById('chat-box');
  chatContainer.innerHTML = "";
  snapshot.forEach((child) => {
    const msg = child.val();
    const msgClass = msg.sender === "Customer" ? "user" : "owner";
    chatContainer.innerHTML += `<div class="msg ${msgClass}">${msg.text}</div>`;
  });
  chatContainer.scrollTop = chatContainer.scrollHeight;
});