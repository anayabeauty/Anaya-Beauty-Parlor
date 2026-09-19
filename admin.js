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

let isParlorOpen = false;

function convertImageToBase64(fileInput, maxWidth = 600, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const file = fileInput.files[0];
    if (!file) return reject("No file selected!");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
    };
    reader.onerror = (err) => reject(err);
  });
}

db.ref('parlorStatus').on('value', (snapshot) => {
  isParlorOpen = snapshot.val() || false;
  const badge = document.getElementById('current-status');
  badge.textContent = isParlorOpen ? "OPEN TODAY" : "CLOSED TODAY";
  badge.className = isParlorOpen ? "status-badge open" : "status-badge closed";
});

function toggleStatus() {
  db.ref('parlorStatus').set(!isParlorOpen);
}

db.ref('bookings').on('value', (snapshot) => {
  const container = document.getElementById('bookings-list');
  container.innerHTML = snapshot.exists() ? "" : `<p style="font-size: 0.85rem; color: #666;">No bookings yet.</p>`;
  if (!snapshot.exists()) return;
  Object.values(snapshot.val()).reverse().forEach((b) => {
    container.innerHTML += `
      <div class="item-box">
        <strong>Token ${b.token}</strong> - ${b.time} (${b.date})<br>
        <strong>Client:</strong> ${b.name} (${b.phone})<br>
        <strong>Service:</strong> ${b.service}
      </div>`;
  });
});

async function uploadProduct() {
  const name = document.getElementById('prod-name').value;
  const price = document.getElementById('prod-price').value;
  const fileInput = document.getElementById('prod-file');
  const btn = document.getElementById('btn-prod');

  try {
    btn.disabled = true;
    btn.textContent = "Uploading...";
    const imgBase64 = await convertImageToBase64(fileInput);
    db.ref('products').push({ name, price, img: imgBase64 }, (err) => {
      btn.disabled = false;
      btn.textContent = "Upload Product";
      if (!err) {
        document.getElementById('prod-name').value = '';
        document.getElementById('prod-price').value = '';
        fileInput.value = '';
        alert("Product uploaded!");
      }
    });
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "Upload Product";
    alert("Error uploading image.");
  }
}

db.ref('products').on('value', (snapshot) => {
  const list = document.getElementById('products-admin-list');
  list.innerHTML = "";
  if (!snapshot.exists()) return;
  snapshot.forEach((child) => {
    const p = child.val();
    list.innerHTML += `<div class="item-box"><strong>${p.name}</strong> - ${p.price} PKR<img src="${p.img}" class="item-img"></div>`;
  });
});

db.ref('orders').on('value', (snapshot) => {
  const container = document.getElementById('orders-list');
  container.innerHTML = snapshot.exists() ? "" : `<p style="font-size: 0.85rem; color: #666;">No orders yet.</p>`;
  if (!snapshot.exists()) return;
  Object.values(snapshot.val()).reverse().forEach((o) => {
    container.innerHTML += `<div class="item-box"><strong>Product:</strong> ${o.productName}<br><strong>Customer:</strong> ${o.customerName} (${o.phone})<br><strong>Address:</strong> ${o.address}</div>`;
  });
});

async function uploadGalleryPhoto() {
  const title = document.getElementById('gal-title').value;
  const fileInput = document.getElementById('gal-file');
  const btn = document.getElementById('btn-gal');

  try {
    btn.disabled = true;
    btn.textContent = "Uploading...";
    const imgBase64 = await convertImageToBase64(fileInput);
    db.ref('gallery').push({ title, img: imgBase64 }, (err) => {
      btn.disabled = false;
      btn.textContent = "Upload Photo";
      if (!err) {
        document.getElementById('gal-title').value = '';
        fileInput.value = '';
        alert("Photo uploaded!");
      }
    });
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "Upload Photo";
    alert("Error uploading image.");
  }
}

db.ref('gallery').on('value', (snapshot) => {
  const list = document.getElementById('gallery-admin-list');
  list.innerHTML = "";
  if (!snapshot.exists()) return;
  snapshot.forEach((child) => {
    const g = child.val();
    list.innerHTML += `<div class="item-box"><strong>${g.title}</strong><img src="${g.img}" class="item-img"></div>`;
  });
});

function sendOwnerMessage() {
  const input = document.getElementById('owner-msg');
  if (input.value.trim() !== "") {
    db.ref('chats').push({ sender: "Owner", text: input.value.trim(), timestamp: firebase.database.ServerValue.TIMESTAMP });
    input.value = "";
  }
}

db.ref('chats').on('value', (snapshot) => {
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = "";
  if (!snapshot.exists()) return;
  snapshot.forEach((child) => {
    const msg = child.val();
    const msgClass = msg.sender === "Owner" ? "owner" : "user";
    chatBox.innerHTML += `<div class="msg ${msgClass}"><strong>${msg.sender}:</strong> ${msg.text}</div>`;
  });
  chatBox.scrollTop = chatBox.scrollHeight;
});