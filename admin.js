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

// Utility: Convert Image File to Compressed Base64 String
function convertImageToBase64(fileInput, maxWidth = 600, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const file = fileInput.files[0];
    if (!file) {
      reject("No file selected!");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Compress image to JPEG
        const base64Data = canvas.toDataURL("image/jpeg", quality);
        resolve(base64Data);
      };
    };

    reader.onerror = (error) => reject(error);
  });
}

// 1. Parlor Availability Status
db.ref('parlorStatus').on('value', (snapshot) => {
  isParlorOpen = snapshot.val() || false;
  const badge = document.getElementById('current-status');
  badge.textContent = isParlorOpen ? "OPEN TODAY" : "CLOSED TODAY";
  badge.className = isParlorOpen ? "status-badge open" : "status-badge closed";
});

function toggleStatus() {
  db.ref('parlorStatus').set(!isParlorOpen);
}

// 2. Fetch Appointments
db.ref('bookings').on('value', (snapshot) => {
  const container = document.getElementById('bookings-list');
  container.innerHTML = "";
  if (!snapshot.exists()) {
    container.innerHTML = `<p style="font-size: 0.85rem; color: #666;">No appointments booked yet.</p>`;
    return;
  }
  Object.values(snapshot.val()).reverse().forEach((b) => {
    container.innerHTML += `
      <div class="item-box">
        <strong>Token ${b.token}</strong> - ${b.time} (${b.date})<br>
        <strong>Client:</strong> ${b.name} (${b.phone})<br>
        <strong>Service:</strong> ${b.service}
      </div>`;
  });
});

// 3. Direct Product Image Upload
async function uploadProduct() {
  const name = document.getElementById('prod-name').value;
  const price = document.getElementById('prod-price').value;
  const fileInput = document.getElementById('prod-file');
  const btn = document.getElementById('btn-prod');

  try {
    btn.disabled = true;
    btn.textContent = "Uploading Image...";

    const imgBase64 = await convertImageToBase64(fileInput);

    db.ref('products').push({ name, price, img: imgBase64 }, (error) => {
      btn.disabled = false;
      btn.textContent = "Upload Product";
      if (!error) {
        document.getElementById('prod-name').value = '';
        document.getElementById('prod-price').value = '';
        fileInput.value = '';
        alert("Product uploaded successfully!");
      }
    });
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "Upload Product";
    alert("Error uploading image. Please try again.");
  }
}

db.ref('products').on('value', (snapshot) => {
  const list = document.getElementById('products-admin-list');
  list.innerHTML = "";
  if (!snapshot.exists()) return;

  snapshot.forEach((child) => {
    const p = child.val();
    list.innerHTML += `
      <div class="item-box">
        <strong>${p.name}</strong> - ${p.price} PKR
        <img src="${p.img}" class="item-img" onerror="this.src='https://via.placeholder.com/150'">
      </div>`;
  });
});

// 4. Product Orders Reader
db.ref('orders').on('value', (snapshot) => {
  const container = document.getElementById('orders-list');
  container.innerHTML = "";
  if (!snapshot.exists()) {
    container.innerHTML = `<p style="font-size: 0.85rem; color: #666;">No product orders received.</p>`;
    return;
  }
  Object.values(snapshot.val()).reverse().forEach((o) => {
    container.innerHTML += `
      <div class="item-box">
        <strong>Product:</strong> ${o.productName}<br>
        <strong>Customer:</strong> ${o.customerName} (${o.phone})<br>
        <strong>Address:</strong> ${o.address}
      </div>`;
  });
});

// 5. Direct Gallery Image Upload
async function uploadGalleryPhoto() {
  const title = document.getElementById('gal-title').value;
  const fileInput = document.getElementById('gal-file');
  const btn = document.getElementById('btn-gal');

  try {
    btn.disabled = true;
    btn.textContent = "Uploading Image...";

    const imgBase64 = await convertImageToBase64(fileInput);

    db.ref('gallery').push({ title, img: imgBase64 }, (error) => {
      btn.disabled = false;
      btn.textContent = "Upload Photo";
      if (!error) {
        document.getElementById('gal-title').value = '';
        fileInput.value = '';
        alert("Gallery photo published successfully!");
      }
    });
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "Upload Photo";
    alert("Error uploading image. Please try again.");
  }
}

db.ref('gallery').on('value', (snapshot) => {
  const list = document.getElementById('gallery-admin-list');
  list.innerHTML = "";
  if (!snapshot.exists()) return;

  snapshot.forEach((child) => {
    const g = child.val();
    list.innerHTML += `
      <div class="item-box">
        <strong>${g.title}</strong>
        <img src="${g.img}" class="item-img" onerror="this.src='https://via.placeholder.com/150'">
      </div>`;
  });
});

// 6. Live Chat Sync
function sendOwnerMessage() {
  const input = document.getElementById('owner-msg');
  if (input.value.trim() !== "") {
    db.ref('chats').push({
      sender: "Owner",
      text: input.value.trim(),
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    input.value = "";
  }
}

db.ref('chats').on('value', (snapshot) => {
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = "";
  snapshot.forEach((child) => {
    const msg = child.val();
    const msgClass = msg.sender === "Owner" ? "owner" : "user";
    chatBox.innerHTML += `<div class="msg ${msgClass}"><strong>${msg.sender}:</strong> ${msg.text}</div>`;
  });
  chatBox.scrollTop = chatBox.scrollHeight;
});