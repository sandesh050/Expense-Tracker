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

// Filter element
const filterSelect = document.getElementById('filter');

// Edit mode vars
let editMode = false;
let editDocId = null;

// Show message helper
function showMessage(text, color = 'green') {
  message.textContent = text;
  message.style.color = color;
  setTimeout(() => {
    message.textContent = '';
  }, 4000);
}

// Auth handlers
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

// Cancel edit button
const cancelEditBtn = document.getElementById('cancel-edit-btn');
cancelEditBtn.addEventListener('click', () => {
  exitEditMode();
});

// Enter edit mode helper
function enterEditMode(docId, data) {
  editMode = true;
  editDocId = docId;
  titleInput.value = data.title;
  amountInput.value = data.amount;
  typeInput.value = data.type;
  document.getElementById('submit-btn').textContent = 'Update';
  cancelEditBtn.style.display = 'inline-block';
}

// Exit edit mode helper
function exitEditMode() {
  editMode = false;
  editDocId = null;
  titleInput.value = '';
  amountInput.value = '';
  typeInput.value = 'expense';
  document.getElementById('submit-btn').textContent = 'Add';
  cancelEditBtn.style.display = 'none';
}

// Auth state change listener
let unsubscribeTransactions = null; // To unsubscribe from Firestore on logout
let currentFilter = 'all';

onAuthStateChanged(auth, (user) => {
  if (user) {
    mainApp.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    authSection.style.display = 'none';

    // Load transactions with filter
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

// Add or Update transaction
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
      // Update existing transaction
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
      // Add new transaction
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
    console.error(error);
  }
});

// Load transactions and show totals, apply filter
function loadTransactions(uid) {
  const q = query(collection(db, `users/${uid}/transactions`), orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    transactionList.innerHTML = '';
    let totalIncome = 0;
    let totalExpense = 0;

    // Store transactions temporarily to filter later
    const transactions = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({ id: doc.id, ...data });
    });

    // Filter transactions based on currentFilter
    let filteredTransactions = transactions;
    if (currentFilter === 'income') {
      filteredTransactions = transactions.filter(t => t.type === 'income');
    } else if (currentFilter === 'expense') {
      filteredTransactions = transactions.filter(t => t.type === 'expense');
    }

    filteredTransactions.forEach(({ id, title, amount, type }) => {
      const li = document.createElement('li');
      li.className = type === 'income' ? 'income' : 'expense';

      li.innerHTML = `
        ${type === 'income' ? 'Income' : 'Expense'} - ${title}: ₹${amount.toFixed(2)}
        <span class="transaction-actions">
          <button class="edit-btn" data-id="${id}">Edit</button>
          <button class="delete-btn" data-id="${id}">Delete</button>
        </span>
      `;

      transactionList.appendChild(li);

      if (type === 'income') totalIncome += amount;
      else totalExpense += amount;
    });

    const balance = totalIncome - totalExpense;
    totalIncomeDisplay.textContent = totalIncome.toFixed(2);
    totalExpenseDisplay.textContent = totalExpense.toFixed(2);
    balanceDisplay.textContent = balance.toFixed(2);

    // Attach event listeners for edit and delete buttons
    transactionList.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const transaction = transactions.find(t => t.id === id);
        if (transaction) {
          enterEditMode(id, transaction);
        }
      });
    });

    transactionList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const user = auth.currentUser;
        if (!user) {
          showMessage('You must be logged in', 'red');
          return;
        }
        if (confirm('Are you sure you want to delete this transaction?')) {
          try {
            await deleteDoc(doc(db, `users/${user.uid}/transactions`, id));
            showMessage('✅ Transaction deleted');
            // If currently editing this, exit edit mode
            if (editMode && editDocId === id) exitEditMode();
          } catch (error) {
            showMessage('❌ Failed to delete transaction: ' + error.message, 'red');
            console.error(error);
          }
        }
      });
    });
  });
}

// Filter dropdown change handler
filterSelect.addEventListener('change', () => {
  currentFilter = filterSelect.value;
  const user = auth.currentUser;
  if (user && unsubscribeTransactions) {
    unsubscribeTransactions();
    unsubscribeTransactions = loadTransactions(user.uid);
  }
});
