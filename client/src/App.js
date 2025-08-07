import { useEffect, useState } from "react";
import axios from "axios";
import Flashcard from "./Flashcard";
import "./App.css";

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [parsedCards, setParsedCards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [loading, setLoading] = useState(false);
  const [flip, setFlip] = useState(false);
  const [stackName, setStackName] = useState("");
  const [savedStacks, setSavedStacks] = useState([]);
  const [mode, setMode] = useState("flashcard");
  const [score, setScore] = useState(0);

  const BASE_URL = "https://flashcard-backend-wbhl.onrender.com";

  useEffect(() => {
    fetchStacks();
  }, []);

  const handleFileChange = (e) => setPdfFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!pdfFile) return alert("Please upload a PDF first.");
    const formData = new FormData();
    formData.append("pdf", pdfFile);
    try {
      const response = await axios.post(`${BASE_URL}/upload-pdf`, formData);
      setExtractedText(response.data.extracted_text);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload and extract PDF.");
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!extractedText) return alert("Please extract text first.");
    const chunkSize = 2000;
    const chunks = [];
    for (let i = 0; i < extractedText.length; i += chunkSize) {
      chunks.push(extractedText.slice(i, i + chunkSize));
    }
    setLoading(true);
    const allCards = [];
    try {
      for (let chunk of chunks) {
        const response = await axios.post(`${BASE_URL}/generate-flashcards`, { text: chunk });
        if (response.data.cards) allCards.push(...response.data.cards);
      }
      setParsedCards(allCards);
      setCurrentCard(0);
      setScore(0);
      setFlip(false);
    } catch (err) {
      console.error("Flashcard generation failed:", err);
      alert("⚠️ Something went wrong while generating flashcards.");
    }
    setLoading(false);
  };

  const handleShuffle = () => {
    const shuffled = [...parsedCards].sort(() => Math.random() - 0.5);
    setParsedCards(shuffled);
    setCurrentCard(0);
    setFlip(false);
    setScore(0);
  };

  const goToNextCard = () => {
    setFlip(false);
    setTimeout(() => {
      setCurrentCard((prev) => prev + 1);
    }, 300);
  };

  const goToPrevCard = () => {
    setFlip(false);
    setTimeout(() => {
      setCurrentCard((prev) => Math.max(prev - 1, 0));
    }, 300);
  };

  const handleSaveStack = async () => {
    if (!stackName || parsedCards.length === 0) return alert("Enter stack name and generate flashcards first.");
    try {
      await axios.post(`${BASE_URL}/save-stack`, { stack_name: stackName, cards: parsedCards });
      alert("✅ Stack saved!");
      fetchStacks();
    } catch (err) {
      console.error("Save stack error:", err);
      alert("⚠️ Failed to save stack.");
    }
  };

  // 🔥 UPDATED FUNCTION
  const fetchStacks = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/get-stacks`);
      console.log("✅ Response from backend:", res);

      if (res.data && Array.isArray(res.data.stacks)) {
        setSavedStacks(res.data.stacks);
      } else {
        console.warn("⚠️ Unexpected response format:", res.data);
        setSavedStacks([]);
      }
    } catch (err) {
      console.error("❌ Fetching stacks failed:", err);
      if (err.response) {
        console.error("Backend error response:", err.response.data);
      } else if (err.request) {
        console.error("No response received:", err.request);
      } else {
        console.error("Other error:", err.message);
      }
    }
  };

  const loadStack = async (name) => {
    try {
      const res = await axios.get(`${BASE_URL}/get-stack/${name}`);
      setParsedCards(res.data.cards);
      setCurrentCard(0);
      setScore(0);
      setFlip(false);
    } catch (err) {
      console.error("Loading stack failed:", err);
    }
  };

  const handleRestart = () => {
    setCurrentCard(0);
    setScore(0);
    setFlip(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f6fa" }}>
      <div style={{ flex: 1, padding: "40px", background: "white", boxShadow: "2px 0 8px rgba(0,0,0,0.05)" }}>
        <h1>📚 Flashcard Generator</h1>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload PDF</button>
        {extractedText && (
          <button onClick={handleGenerateFlashcards} disabled={loading}>
            {loading ? "Generating..." : "Generate Flashcards"}
          </button>
        )}
        <input
          type="text"
          placeholder="Stack name"
          value={stackName}
          onChange={(e) => setStackName(e.target.value)}
          style={{ marginTop: "20px", padding: "8px", borderRadius: "6px" }}
        />
        <button onClick={handleSaveStack}>💾 Save Stack</button>
        <div style={{ marginTop: "30px" }}>
          <h3>📂 Your Saved Stacks</h3>
          {savedStacks.length > 0 ? (
            savedStacks.map((name, i) => (
              <button key={i} onClick={() => loadStack(name)} style={{ margin: "5px" }}>
                {name}
              </button>
            ))
          ) : (
            <p>No stacks saved yet.</p>
          )}
        </div>
      </div>

      <div style={{ flex: 2, padding: "40px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {parsedCards.length > 0 && currentCard < parsedCards.length ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h2>🧠 Flashcards</h2>
            <div style={{ marginBottom: "15px" }}>
              <button onClick={() => setMode("flashcard")} style={{ marginRight: "10px" }}>
                Flashcards
              </button>
              <button onClick={() => setMode("multiple")}>Multiple Choice</button>
            </div>
            <Flashcard
              question={parsedCards[currentCard].question}
              answer={parsedCards[currentCard].answer}
              distractors={parsedCards[currentCard].distractors}
              flip={flip}
              setFlip={setFlip}
              mode={mode}
              goToNextCard={goToNextCard}
              goToPrevCard={goToPrevCard}
              handleShuffle={handleShuffle}
              currentIndex={currentCard}
              totalCards={parsedCards.length}
              score={score}
              setScore={setScore}
            />
          </div>
        ) : parsedCards.length > 0 && (
          <div style={{ textAlign: "center" }}>
            <h2>🎉 All done!</h2>
            <p>You scored {score} out of {parsedCards.length}</p>
            <button onClick={handleRestart}>🔁 Restart</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
