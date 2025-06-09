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
const welcomeMessage = document.getElementById('welcome-message');

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

    // Show welcome message
    welcomeMessage.textContent = `Welcome, ${user.displayName || user.email}!`;
    welcomeMessage.style.display = 'block';

  } else {
    mainApp.style.display = 'none';
    logoutBtn.style.display = 'none';
    authSection.style.display = 'block';
    transactionList.innerHTML = '';
    totalIncomeDisplay.textContent = '0';
    totalExpenseDisplay.textContent = '0';
    balanceDisplay.textContent = '0';

    welcomeMessage.textContent = '';
    welcomeMessage.style.display = 'none';
  }
});

// Add transaction
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type = typeInput.value;

  if (!title || isNaN(amount) || amount <= 0) {
    showMessage('Please enter valid title and amount', 'red');
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    showMessage('You must be logged in to add transactions', 'red');
    return;
  }

  try {
    await addDoc(collection(db, 'users', user.uid, 'transactions'), {
      title,
      amount,
      type,
      createdAt: new Date()
    });
    showMessage('Transaction added successfully!');
    form.reset();
  } catch (error) {
    console.error(error);
    showMessage('Error adding transaction', 'red');
  }
});

// Load transactions and listen for changes
function loadTransactions(uid) {
  const transactionsRef = collection(db, 'users', uid, 'transactions');
  const q = query(transactionsRef, orderBy('createdAt', 'desc'));

  // Clear current list
  transactionList.innerHTML = '';
  totalIncomeDisplay.textContent = '0';
  totalExpenseDisplay.textContent = '0';
  balanceDisplay.textContent = '0';

  onSnapshot(q, (snapshot) => {
    let totalIncome = 0;
    let totalExpense = 0;
    transactionList.innerHTML = '';

    snapshot.forEach((doc) => {
      const data = doc.data();
      const li = document.createElement('li');
      li.textContent = `${data.title} — ₹${data.amount.toFixed(2)}`;
      li.classList.add(data.type);

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
    console.error('Error loading transactions:', error);
  });
}
