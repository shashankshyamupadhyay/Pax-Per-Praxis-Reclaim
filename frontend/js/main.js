// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Anonymous login
auth.signInAnonymously()
  .then(() => {
    console.log("Signed in anonymously");
  })
  .catch((error) => {
    console.error("Auth error:", error);
  });

console.log("main.js loaded successfully");

async function generatePlan() {
  const duration = document.getElementById("duration").value;
  const energy = document.getElementById("energy").value;
  const goal = document.getElementById("goal").value;

  if (!duration) {
    alert("Please enter commute time.");
    return;
  }

  const prompt = `
You are an AI assistant designed to help students reclaim wasted commute time.

Input:
- Commute duration: ${duration} minutes
- Energy level: ${energy}
- Goal: ${goal}

Generate a realistic micro-plan suitable for commuting.
Split into 3–5 activities with duration and one-line benefit.
`;

  const outputDiv = document.getElementById("output");
  outputDiv.innerText = "Generating plan...";

  try {
    const response = await fetch("http://localhost:3000/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Gemini raw response:", data);

    // ✅ PREREQUISITE: extract Gemini text cleanly
    const outputText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response received.";

    // Show on UI
    outputDiv.innerText = outputText;

    // ✅ SAVE TO FIRESTORE (AFTER Gemini output exists)
    await db.collection("plans").add({
      duration: Number(duration),
      energy: energy,
      goal: goal,
      planText: outputText,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log("Plan saved to Firestore");

  } catch (err) {
    outputDiv.innerText = "Error generating plan. Check console.";
    console.error(err);
  }
}
