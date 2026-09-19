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

let currentStatus = false;

document.addEventListener("DOMContentLoaded", () => {
  listenToParlorStatus();
  listenToBookings();
  listenToAdminChat();
});

// Toggle Open / Closed Status
function listenToParlorStatus() {
  db.ref('parlorStatus').on('value', (snapshot) => {
    currentStatus = !!snapshot.val();
    const display = document.getElementById("status-display");
    const btn = document.getElementById("toggle-status-btn");

    if (currentStatus) {
      display.textContent = "OPEN";
      display.style.color = "green";
      btn.textContent = "Set Parlor to CLOSED";
      btn.className = "btn closed-btn";
    } else {
      display.textContent = "CLOSED";
      display.style.color = "red";
      btn.textContent = "Set Parlor to OPEN";
      btn.className = "btn toggle-btn";
    }
  });
}

function toggleParlorStatus() {
  db.ref('parlorStatus').set(!currentStatus);
}

// Add Product
function addProduct() {
  const name = document.getElementById("prod-name").value.trim();
  const price = document.getElementById("prod-price").value.trim();
  const img = document.getElementById("prod-img").value.trim();

  if (!name || !price || !img) {
    alert("Please fill in all product fields.");
    return;
  }

  db.ref('products').push({ name, price, img }, (err) => {
    if (!err) {
      alert("Product added successfully!");
      document.getElementById("prod-name").value = "";
      document.getElementById("prod-price").value = "";
      document.getElementById("prod-img").value = "";
    }
  });
}

// Add Gallery Photo
function addGalleryImage() {
  const title = document.getElementById("gal-title").value.trim();
  const img = document.getElementById("gal-img").value.trim();

  if (!title || !img) {
    alert("Please fill in all gallery fields.");
    return;
  }

  db.ref('gallery').push({ title, img }, (err) => {
    if (!err) {
      alert("Photo uploaded to gallery!");
      document.getElementById("gal-title").value = "";
      document.getElementById("gal-img").value = "";
    }
  });
}

// Listen to Bookings
function listenToBookings() {
  db.ref('bookings').on('value', (snapshot) => {
    const container = document.getElementById("bookings-list");
    container.innerHTML = snapshot.exists() ? "" : `<p style="font-size:0.85rem; color:#777;">No bookings received yet.</p>`;

    snapshot.forEach((child) => {
      const b = child.val();
      container.innerHTML += `
        <div class="booking-item">
          <strong>Token: ${b.token}</strong> | Service: ${b.service}<br>
          Name: ${b.name} | Phone: ${b.phone}<br>
          Payment: ${b.paymentStatus} | Date: ${b.date} (${b.time})
        </div>`;
    });
  });
}

// Support Chat
function sendOwnerMessage() {
  const input = document.getElementById("admin-chat-msg");
  if (input && input.value.trim() !== "") {
    db.ref('chats').push({ sender: "Owner", text: input.value.trim(), timestamp: firebase.database.ServerValue.TIMESTAMP });
    input.value = "";
  }
}

function listenToAdminChat() {
  db.ref('chats').on('value', (snapshot) => {
    const box = document.getElementById("admin-chat-box");
    if (!box) return;
    box.innerHTML = "";
    if (!snapshot.exists()) return;

    snapshot.forEach((child) => {
      const msg = child.val();
      const isOwner = msg.sender === "Owner";
      box.innerHTML += `<div class="msg ${isOwner ? 'owner' : 'user'}"><strong>${isOwner ? 'You' : 'Customer'}:</strong> ${msg.text}</div>`;
    });
    box.scrollTop = box.scrollHeight;
  });
}
