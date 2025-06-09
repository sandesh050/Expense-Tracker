import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Firebase configuration
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

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');

const filterSelect = document.getElementById('filter');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

// State variables
let editMode = false;
let editDocId = null;
let unsubscribeTransactions = null;
let currentFilter = 'all';

// Show messages to user
function showMessage(text, color = 'green') {
  message.textContent = text;
  message.style.color = color;
  setTimeout(() => {
    message.textContent = '';
  }, 4000);
}

// Enter edit mode
function enterEditMode(docId, data) {
  editMode = true;
  editDocId = docId;
  titleInput.value = data.title;
  amountInput.value = data.amount;
  typeInput.value = data.type;
  document.getElementById('submit-btn').textContent = 'Update';
  cancelEditBtn.style.display = 'inline-block';
}

// Exit edit mode
function exitEditMode() {
  editMode = false;
  editDocId = null;
  titleInput.value = '';
  amountInput.value = '';
  typeInput.value = 'expense';
  document.getElementById('submit-btn').textContent = 'Add';
  cancelEditBtn.style.display = 'none';
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
    .catch(error => {
      showMessage("❌ Login failed: " + error.message, 'red');
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
    .catch(error => {
      showMessage("❌ Signup failed: " + error.message, 'red');
    });
});

// Logout handler
logoutBtn.addEventListener('click', () => {
  signOut(auth)
    .then(() => {
      showMessage("👋 Logged out!", 'blue');
    })
    .catch(error => {
      showMessage("❌ Logout failed: " + error.message, 'red');
    });
});

// Cancel edit button
cancelEditBtn.addEventListener('click', exitEditMode);

// Form submission (Add or Update transaction)
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
    if (editMode && editDocId) {
      const docRef = doc(db, `users/${user.uid}/transactions`, editDocId);
      await updateDoc(docRef, {
        title,
        amount,
        type,
        timestamp: new Date()
      });
      showMessage('✅ Transaction updated!');
      exitEditMode();
    } else {
      await addDoc(collection(db, `users/${user.uid}/transactions`), {
        title,
        amount,
        type,
        timestamp: new Date()
      });
      showMessage('✅ Transaction added!');
    }

    titleInput.value = '';
    amountInput.value = '';
    typeInput.value = 'expense';

  } catch (error) {
    showMessage('❌ Failed to save transaction: ' + error.message, 'red');
  }
});

// Load and render transactions with real-time updates
function loadTransactions(uid) {
  const q = query(collection(db, `users/${uid}/transactions`), orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    transactionList.innerHTML = '';
    let totalIncome = 0;
    let totalExpense = 0;

    const transactions = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      transactions.push({ id: doc.id, ...data });
    });

    let filteredTransactions = transactions;
    if (currentFilter === 'income') {
      filteredTransactions = transactions.filter(t => t.type === 'income');
    } else if (currentFilter === 'expense') {
      filteredTransactions = transactions.filter(t => t.type === 'expense');
    }

    filteredTransactions.forEach(tx => {
      const li = document.createElement('li');
      li.classList.add(tx.type);

      li.innerHTML = `
        <span>${tx.title} - ₹${tx.amount.toFixed(2)}</span>
        <div class="transaction-actions">
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
        </div>
      `;

      const editBtn = li.querySelector('.edit-btn');
      const deleteBtn = li.querySelector('.delete-btn');

      editBtn.addEventListener('click', () => {
        enterEditMode(tx.id, tx);
      });

      deleteBtn.addEventListener('click', async () => {
        if (confirm('Delete this transaction?')) {
          try {
            await deleteDoc(doc(db, `users/${uid}/transactions`, tx.id));
            showMessage('✅ Transaction deleted!');
            if (editMode && editDocId === tx.id) {
              exitEditMode();
            }
          } catch (error) {
            showMessage('❌ Failed to delete: ' + error.message, 'red');
          }
        }
      });

      transactionList.appendChild(li);

      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount;
      }
    });

    totalIncomeDisplay.textContent = totalIncome.toFixed(2);
    totalExpenseDisplay.textContent = totalExpense.toFixed(2);
    balanceDisplay.textContent = (totalIncome - totalExpense).toFixed(2);
  });
}

// Filter change handler
filterSelect.addEventListener('change', () => {
  currentFilter = filterSelect.value;

  const user = auth.currentUser;
  if (user && unsubscribeTransactions) {
    unsubscribeTransactions();
  }
  if (user) {
    unsubscribeTransactions = loadTransactions(user.uid);
  }
});

// Listen to authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    mainApp.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    authSection.style.display = 'none';

    if (unsubscribeTransactions) unsubscribeTransactions();
    unsubscribeTransactions = loadTransactions(user.uid);

  } else {
    mainApp.style.display = 'none';
    logoutBtn.style.display = 'none';
    authSection.style.display = 'block';

    transactionList.innerHTML = '';
    totalIncomeDisplay.textContent = '0';
    totalExpenseDisplay.textContent = '0';
    balanceDisplay.textContent = '0';

    exitEditMode();

    if (unsubscribeTransactions) {
      unsubscribeTransactions();
      unsubscribeTransactions = null;
    }
  }
});
