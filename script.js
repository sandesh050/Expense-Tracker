// Import Firebase app and Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIgRZCMqbRxo7jhYJCwVoIz3re6L_g8GM",
  authDomain: "expense-tracker-d5631.firebaseapp.com",
  projectId: "expense-tracker-d5631",
  storageBucket: "expense-tracker-d5631.firebasestorage.app",
  messagingSenderId: "336895637396",
  appId: "1:336895637396:web:f8a98f8a17ec6cf70a8181"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Reference to Firestore collection
const expensesCollection = collection(db, "expenses");

// Get form element
const expenseForm = document.getElementById('expense-form');

// Add submit event listener
expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // stop page from refreshing

  const title = document.getElementById('title').value;
  const amount = parseFloat(document.getElementById('amount').value);

  try {
    // Add new document into Firestore
    await addDoc(expensesCollection, {
      title: title,
      amount: amount,
      createdAt: new Date()
    });

    alert("Expense Added Successfully! 🎉");

    // Clear the form
    expenseForm.reset();

    // Optionally: reload expenses list (we'll code that next!)
  } catch (error) {
    console.error("Error adding expense: ", error);
    alert("Failed to add expense!");
  }
});


