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

// Helper to show messages
function showMessage(text, color = 'green') {
  message.textContent = text;
  message.style.color = color;
  setTimeout(() => {
    message.textContent = '';
  }, 4000);
}

// Auth Handlers
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

logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    showMessage("👋 Logged out!", 'blue');
  });
});

// Auth state change listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    mainApp.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    authSection.style.display = 'none';
    loadTransactions(user.uid);
  } else {
    mainApp.style.display = 'none';
    logoutBtn.style.display = 'none';
    authSection.style.display = 'block';
    transactionList.innerHTML = '';
    totalIncomeDisplay.textContent = '0';
    totalExpenseDisplay.textContent = '0';
    balanceDisplay.textContent = '0';
  }
});

// Add transaction
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type = typeInput.value;

  if (!title) {
    showMessage('Please enter a title', 'red');
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    showMessage('Please enter a valid positive amount', 'red');
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    showMessage('You must be logged in to add transactions', 'red');
    return;
  }

  try {
    await addDoc(collection(db, `users/${user.uid}/transactions`), {
      title,
      amount,
      type,
      timestamp: new Date()
    });

    showMessage('✅ Transaction added!');
    titleInput.value = '';
    amountInput.value = '';
  } catch (error) {
    showMessage('❌ Failed to add transaction: ' + error.message, 'red');
    console.error(error);
  }
});

// Load transactions and display totals
function loadTransactions(uid) {
  const q = query(collection(db, `users/${uid}/transactions`), orderBy('timestamp', 'desc'));

  onSnapshot(q, (snapshot) => {
    transactionList.innerHTML = '';
    let totalIncome = 0;
    let totalExpense = 0;

    snapshot.forEach((doc) => {
      const { title, amount, type } = doc.data();
      const li = document.createElement('li');
      li.className = type === 'income' ? 'income' : 'expense';
      li.textContent = `${type === 'income' ? 'Income' : 'Expense'} - ${title}: ₹${amount.toFixed(2)}`;
      transactionList.appendChild(li);

      if (type === 'income') totalIncome += amount;
      else totalExpense += amount;
    });

    const balance = totalIncome - totalExpense;
    totalIncomeDisplay.textContent = totalIncome.toFixed(2);
    totalExpenseDisplay.textContent = totalExpense.toFixed(2);
    balanceDisplay.textContent = balance.toFixed(2);
  }, (error) => {
    showMessage('Error loading transactions: ' + error.message, 'red');
    console.error(error);
  });
}
