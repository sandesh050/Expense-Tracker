import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

//
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
const db = getFirestore(app);

// Form DOM elements
const expenseForm = document.getElementById("expenseForm");
const statusDiv = document.getElementById("status");

expenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("titleInput").value.trim();
  const amount = parseFloat(document.getElementById("amountInput").value);

  if (!title || isNaN(amount)) {
    alert("Please enter valid values.");
    return;
  }

  try {
    await addDoc(collection(db, "expenses"), {
      title,
      amount,
      timestamp: new Date()
    });
    statusDiv.textContent = "✅ Expense added!";
    statusDiv.style.color = "green";
    expenseForm.reset();
  } catch (error) {
    console.error("Error adding expense:", error);
    statusDiv.textContent = "❌ Failed to add expense.";
    statusDiv.style.color = "red";
  }
});
