const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const OpenAI = require("openai");

const app = express();
const port = 3000;

const openai = new OpenAI({
  apiKey: 'UQo1fTmlVnl63YjerFzbDdJHgYPrCm6N',
  baseURL: "https://api.lemonfox.ai/v1", 
});

app.use(cors({ origin: "*", methods: ["GET", "POST"] }));

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => res.send("Express on Vercel"));

app.post("/transcribe", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded" });
  }

  try {
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    console.log(`File uploaded: ${fileName} at ${filePath}`);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      language: "english", 
      response_format: "json", 
    });


    res.json({ transcription: transcription.text || "No transcription returned." });
  } catch (error) {
    console.error("Error during transcription:", error);

    res.status(500).json({
      error: "Error processing transcription",
      details: error.message,
    });
  } finally {
    fs.unlink(req.file.path, (err) => {
      if (err) console.error(`Failed to delete uploaded file: ${err.message}`);
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;
