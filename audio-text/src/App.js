import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [recordings, setRecordings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState("");
  const [timerInterval, setTimerInterval] = useState(null);

  const timerRef = useRef();

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support audio recording.");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      const name = `recording_${Date.now()}.webm`;
      setRecordings((prev) => [...prev, { name, blob, url }]);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);

    setRecordingTime(0);
    const interval = setInterval(() => {
      setRecordingTime((prevTime) => prevTime + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }

    clearInterval(timerInterval);
    setTimerInterval(null);
  };

  const convertRecording = async (recording) => {
    try {
      if (!(recording.blob instanceof Blob)) {
        console.error("Recording is not a Blob");
        setTranscription("Error: Recording is not in the correct format.");
        return;
      }
  
      const formData = new FormData();
      formData.append("file", recording.blob, recording.name); 
      formData.append("language", "english");
      formData.append("response_format", "json");
  
      console.log("FormData keys:", Array.from(formData.entries())); 
          const response = await fetch("http://localhost:3001/transcribe", {
        method: "POST",
        body: formData,
      })
  
      const data = await response.json();
  
      if (response.ok) {
        setTranscription(data.transcription || "Transcription failed.");
      } else {
        console.error("API Error Response:", data);
        setTranscription(`Error: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error during transcription:", error);
      setTranscription("Error transcribing the recording.");
    }
  };
  

  const deleteRecording = (name) => {
    setRecordings((prevRecordings) =>
      prevRecordings.filter((recording) => recording.name !== name)
    );
  };

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  return (
    <div className="App">
      <h1>Audio Recorder & Transcriber</h1>

      <div className="recorder">
        <div className="recorder-status">
          {isRecording ? (
            <>
              <button className="stop-button" onClick={stopRecording}>
                Stop Recording
              </button>
              <div className="recording-timer">Recording: {recordingTime}s</div>
              <div className="recording-waveform">
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
              </div>
            </>
          ) : (
            <button className="start-button" onClick={startRecording}>
              Start Recording
            </button>
          )}
        </div>
      </div>

      <div className="recordings">
        <h2>Recordings</h2>
        {recordings.length > 0 ? (
          recordings.map((recording, index) => (
            <div key={index} className="recording-item">
              <audio controls src={recording.url}></audio>
              <button onClick={() => convertRecording(recording)}>
                Convert
              </button>
              <button
                className="delete-button"
                onClick={() => deleteRecording(recording.name)}
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p>No recordings yet.</p>
        )}
      </div>

      <div className="transcription">
        <h2>Transcription</h2>
        <textarea
          value={transcription}
          readOnly
          placeholder="Transcription will appear here..."
        ></textarea>
      </div>
    </div>
  );
}

export default App;
