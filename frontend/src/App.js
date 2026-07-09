import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateCaptions = async () => {
    if (!file) return alert("Please select a video file!");
    setLoading(true);
    setVideoUrl("");
    setProgress(0);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const res = await axios.post('http://localhost:5000/transcribe', formData, {
        onUploadProgress: (p) => {
          const percent = Math.round((p.loaded * 100) / p.total);
          setProgress(percent > 90 ? 90 : percent); // Hold at 90 during AI burn
        }
      });
      setVideoUrl(res.data.videoUrl);
      setProgress(100);
    } catch (err) {
      alert("Error: Make sure the Python backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const res = await fetch(videoUrl);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "captioned_video.mp4";
    a.click();
  };

  return (
    <div className="app-container">
      <div className="main-card">
        <h1>🎬 AI Captioner <span className="local-tag">LOCAL</span></h1>
        
        {!loading && !videoUrl && (
          <div className="upload-box">
            <input type="file" id="file" onChange={(e) => setFile(e.target.files[0])} hidden />
            <label htmlFor="file" className="drop-zone">
              {file ? `✅ ${file.name}` : "📂 Click to Select Video"}
            </label>
            {file && <button onClick={generateCaptions} className="btn-primary">Generate Captioned Video</button>}
          </div>
        )}

        {loading && (
          <div className="loader-box">
            <div className="spinner"></div>
            <p>{progress < 90 ? `Uploading: ${progress}%` : "AI is burning captions..."}</p>
            <div className="progress-bg">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {videoUrl && (
          <div className="result-box">
            <video width="100%" controls key={videoUrl} className="preview-player">
              <source src={videoUrl} type="video/mp4" />
            </video>
            <div className="action-row">
              <button onClick={handleDownload} className="btn-success">💾 Download Video</button>
              <button onClick={() => {setFile(null); setVideoUrl("");}} className="btn-outline">🔄 New Video</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default App;
