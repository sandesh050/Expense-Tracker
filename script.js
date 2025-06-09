import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  doc,
  getDoc
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

// Init
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

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const nameInput = document.getElementById('name');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');

// Show message
function showMessage(text, color = 'green') {
  message.textContent = text;
  message.style.color = color;
  setTimeout(() => message.textContent = '', 4000);
}

// Signup
signupBtn.addEventListener('click', async () => {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!name || !email || !password) {
    showMessage("Fill in all fields", 'red');
    return;
  }

  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", userCred.user.uid), { name });
    showMessage("✅ Signed up successfully!");
  } catch (error) {
    showMessage("❌ " + error.message, 'red');
  }
});

// Login
loginBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showMessage('Enter email and password', 'red');
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => showMessage("✅ Logged in!"))
    .catch((err) => showMessage("❌ " + err.message, 'red'));
});

// Logout
logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => showMessage("👋 Logged out!", 'blue'));
});

// Auth state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    mainApp.style.display = 'block';
    logoutBtn.style.display = 'block';
    authSection.style.display = 'none';

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const name = userDoc.exists() ? userDoc.data().name : "User";
    welcomeMessage.textContent = `Welcome, ${name}!`;

    loadTransactions(user.uid);
  } else {
    mainApp.style.display = 'none';
    logoutBtn.style.display = 'none';
    authSection.style.display = 'block';
    transactionList.innerHTML = '';
    totalIncomeDisplay.textContent = '0';
    totalExpenseDisplay.textContent = '0';
    balanceDisplay.textContent = '0';
    welcomeMessage.textContent = '';
  }
});

// Add Transaction
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const type = typeInput.value;
  const user = auth.currentUser;

  if (!user || !title || isNaN(amount) || amount <= 0) {
    showMessage('Invalid transaction data', 'red');
    return;
  }

  try {
    await addDoc(collection(db, `users/${user.uid}/transactions`), {
      title, amount, type, timestamp: new Date()
    });
    showMessage("✅ Transaction added!");
    form.reset();
  } catch (error) {
    showMessage("❌ Failed to add: " + error.message, 'red');
  }
});

// Load Transactions
function loadTransactions(uid) {
  const q = query(collection(db, `users/${uid}/transactions`), orderBy('timestamp', 'desc'));

  onSnapshot(q, (snapshot) => {
    transactionList.innerHTML = '';
    let totalIncome = 0, totalExpense = 0;

    snapshot.forEach((doc) => {
      const { title, amount, type } = doc.data();
      const li = document.createElement('li');
      li.className = type;
      li.textContent = `${type === 'income' ? 'Income' : 'Expense'} - ${title}: ₹${amount.toFixed(2)}`;
      transactionList.appendChild(li);

      if (type === 'income') totalIncome += amount;
      else totalExpense += amount;
    });

    totalIncomeDisplay.textContent = totalIncome.toFixed(2);
    totalExpenseDisplay.textContent = totalExpense.toFixed(2);
    balanceDisplay.textContent = (totalIncome - totalExpense).toFixed(2);
  });
}
