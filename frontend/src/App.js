import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [srt, setSrt] = useState("");
  const [loading, setLoading] = useState(false);

  const uploadVideo = async () => {
    if (!file) return alert("Please select a video file first!");
    setLoading(true);
    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await axios.post('http://localhost:5000/transcribe', formData);
      setSrt(response.data.srt);
    } catch (error) {
      console.error(error);
      alert("Error: Make sure your Backend terminal is running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🎬 AI Video Captioner</h1>
      <div className="upload-section">
        <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="video/*" />
        <button onClick={uploadVideo} disabled={loading} className="btn-primary">
          {loading ? "AI is transcribing... please wait" : "Generate Captions"}
        </button>
      </div>
      {srt && (
        <div className="result-section">
          <textarea value={srt} readOnly className="srt-box" />
          <br />
          <button onClick={() => {
            const element = document.createElement("a");
            const fileBlob = new Blob([srt], {type: 'text/plain'});
            element.href = URL.createObjectURL(fileBlob);
            element.download = "captions.srt";
            element.click();
          }} className="btn-success">Download .SRT</button>
        </div>
      )}
    </div>
  );
}

export default App;