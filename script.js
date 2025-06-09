import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCIgRZCMqbRxo7jhYJCwVoIz3re6L_g8GM",
  authDomain: "expense-tracker-d5631.firebaseapp.com",
  projectId: "expense-tracker-d5631",
  storageBucket: "expense-tracker-d5631.appspot.com",
  messagingSenderId: "336895637396",
  appId: "1:336895637396:web:f8a98f8a17ec6cf70a8181"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM Elements
const form = document.getElementById('transaction-form');
const titleInput = document.getElementById('title');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const message = document.getElementById('message');
const transactionList = document.getElementById('transaction-items');
const totalIncomeDisplay = document.getElementById('total-income');
const totalExpenseDisplay = document.getElementById('total-expense');
const balanceDisplay = document.getElementById('balance');
const mainApp = document.getElementById('main-app');
const authSection = document.getElementById('auth-section');

// Auth elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');

// Show messages helper
function showMessage(text, color = 'green') {
  message.textContent = text;
  message.style.color = color;
  setTimeout(() => {
    message.textContent = '';
  }, 4000);
}

// Login handler
loginBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showMessage('Please enter email and password', 'red');
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      showMessage("✅ Logged in!");
      emailInput.value = '';
      passwordInput.value = '';
    })
    .catch((error) => {
      showMessage("❌ Login failed: " + error.message, 'red');
      console.error(error.message);
    });
});

// Signup handler
signupBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showMessage('Please enter email and password', 'red');
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      showMessage("✅ Signed up!");
      emailInput.value = '';
      passwordInput.value = '';
    })
    .catch((error) => {
      showMessage("❌ Signup failed: " + error.message, 'red');
      console.error(error.message);
    });
});

// Logout handler
logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    showMessage("👋 Logged out!", 'blue');
  });
});

// Listen to auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Show main app and logout btn, hide auth form
    mainApp.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    authSection.style.display = 'none';
    loadTransactions(user.uid);
  } else {
    // Hide main app and logout btn, show auth form
    mainApp.style.display = 'none';
    logoutBtn.style.display = 'none';
    authSection.style.display = 'block';

    // Clear data display
    transactionList.innerHTML = '';
    totalIncomeDisplay.textContent = '0';
    totalExpenseDisplay.textContent = '0';
    balanceDisplay.textContent = '0';
  }
});

// Add new transaction
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    showMessage("You must be logged in to add transactions", 'red');
    return;
  }

  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type = typeInput.value;

  if (!title || isNaN(amount) || amount <= 0) {
    showMessage("Please enter valid title and amount", 'red');
    return;
  }

  try {
    await addDoc(collection(db, "users", user.uid, "transactions"), {
      title,
      amount,
      type,
      timestamp: Date.now()
    });

    titleInput.value = '';
    amountInput.value = '';
    showMessage("Transaction added!");
  } catch (error) {
    console.error("Error adding document: ", error);
    showMessage("Failed to add transaction", 'red');
  }
});

let unsubscribe = null;

// Load transactions in realtime
function loadTransactions(uid) {
  if (unsubscribe) {
    unsubscribe(); // Unsubscribe previous listener if any
  }

  const q = query(collection(db, "users", uid, "transactions"), orderBy("timestamp", "desc"));

  unsubscribe = onSnapshot(q, (snapshot) => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactionList.innerHTML = '';

    snapshot.forEach((doc) => {
      const data = doc.data();

      const li = document.createElement('li');
      li.textContent = `${data.title} - ₹${data.amount.toFixed(2)}`;
      li.classList.add(data.type === 'income' ? 'income' : 'expense');
      transactionList.appendChild(li);

      if (data.type === 'income') {
        totalIncome += data.amount;
      } else {
        totalExpense += data.amount;
      }
    });

    totalIncomeDisplay.textContent = totalIncome.toFixed(2);
    totalExpenseDisplay.textContent = totalExpense.toFixed(2);
    balanceDisplay.textContent = (totalIncome - totalExpense).toFixed(2);
  }, (error) => {
    console.error("Error fetching transactions:", error);
    showMessage("Failed to load transactions", 'red');
  });
}
