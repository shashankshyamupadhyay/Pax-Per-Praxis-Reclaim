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

function formatGeminiResponse(text) {
  return text
    // Headings / bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    // Numbered lists
    .replace(/^\d+\.\s(.+)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ol>$1</ol>")

    // Bullet points
    .replace(/^\*\s(.+)/gm, "<li>$1</li>")

    // Line breaks
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");
}


async function generatePlan() {
  const duration = document.getElementById("duration").value;
  const energy = document.getElementById("energy").value;
  const goal = document.getElementById("goal").value;

  if (!duration) {
    alert("Please enter commute time.");
    return;
  }

  const prompt = `
You are an AI assistant helping students use commute time effectively.

Input:
- Commute duration: ${duration} minutes
- Energy level: ${energy}
- Goal: ${goal}

Output format (STRICT):
Return ONLY valid JSON in this format:

{
  "title": "Short motivating title",
  "activities": [
    {
      "time": "10 min",
      "task": "Activity name",
      "benefit": "One-line benefit"
    }
  ]
}

Rules:
- 3 to 5 activities only
- Keep tasks realistic for commuting
- No extra text, no markdown
`;

  const outputDiv = document.getElementById("output");
  outputDiv.innerText = "Generating plan...";

  try {
  const response = await fetch("/api/generate", {
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

    let plan;
    try {
      plan = JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (e) {
      outputDiv.innerText = "Invalid response format.";
      console.error("JSON parse error:", e);
      return;
    }

    // ✅ UI rendering
    outputDiv.innerHTML = `
      <h2>${plan.title}</h2>
      <div class="plan-cards">
        ${plan.activities
          .map(
            (a) => `
            <div class="card">
              <strong>${a.time}</strong>
              <h3>${a.task}</h3>
              <p>${a.benefit}</p>
            </div>
          `
          )
          .join("")}
      </div>
    `;

    // ✅ Save to Firestore
    await db.collection("plans").add({
      duration: Number(duration),
      energy,
      goal,
      planData: plan,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log("Plan saved to Firestore");

  } catch (err) {
    outputDiv.innerText = "Error generating plan. Check console.";
    console.error(err);
  }
}
