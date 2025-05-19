// Firebase CDN Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCIgRZCMqbRxo7jhYJCwVoIz3re6L_g8GM",
  authDomain: "expense-tracker-d5631.firebaseapp.com",
  projectId: "expense-tracker-d5631",
  storageBucket: "expense-tracker-d5631.firebasestorage.app",
  messagingSenderId: "336895637396",
  appId: "1:336895637396:web:f8a98f8a17ec6cf70a8181"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const titleInput = document.getElementById('title');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const statusText = document.getElementById('status');
const balanceText = document.getElementById('balance');

async function addTransaction() {
  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type = typeInput.value;

  if (!title || isNaN(amount)) {
    statusText.style.color = "red";
    statusText.textContent = "Please enter a valid title and amount.";
    return;
  }

  try {
    await addDoc(collection(db, "transactions"), {
      title,
      amount,
      type,
      timestamp: new Date()
    });

    statusText.style.color = "green";
    statusText.textContent = "✅ Transaction added!";
    titleInput.value = '';
    amountInput.value = '';
    updateBalance();
  } catch (error) {
    statusText.style.color = "red";
    statusText.textContent = "❌ Error adding transaction.";
    console.error(error);
  }
}

async function updateBalance() {
  const snapshot = await getDocs(collection(db, "transactions"));
  let balance = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const amount = parseFloat(data.amount);
    if (data.type === "income") {
      balance += amount;
    } else if (data.type === "expense") {
      balance -= amount;
    }
  });

  balanceText.textContent = `Current Balance: ₹${balance}`;
}

// Initial balance fetch
updateBalance();
