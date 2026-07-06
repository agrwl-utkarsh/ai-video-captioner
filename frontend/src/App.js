import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // 1. Handles file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setVideoUrl(""); // Reset if they pick a new file
    setProgress(0);
  };

  // 2. The Generation Process
  const generateCaptionedVideo = async () => {
    if (!file) return alert("Please select a video file first!");
    
    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const API_BASE = process.env.REACT_APP_API_URL || '';
      const response = await axios.post(`${API_BASE}/transcribe`, formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // We show up to 90% for upload, the last 10% is AI processing
          setProgress(percent > 90 ? 90 : percent);
        },
      });

      setVideoUrl(response.data.videoUrl);
      setProgress(100);
    } catch (error) {
      console.error(error);
      alert("Processing failed. Check if your Backend Terminal is running.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Force Download Logic
  const handleDownload = async () => {
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "captioned_video.mp4";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="app-wrapper">
      <div className="glass-card">
        <header>
          <h1>🎬 AI Video Captioner</h1>
          <p>Burn professional captions into your videos automatically.</p>
        </header>

        {/* STEP 1: UPLOAD & GENERATE */}
        {!loading && !videoUrl && (
          <div className="upload-zone">
            <div className="file-input-wrapper">
              <input type="file" id="video-upload" onChange={handleFileChange} accept="video/*" />
              <label htmlFor="video-upload">
                {file ? file.name : "📁 Choose a Video File"}
              </label>
            </div>
            {file && (
              <button onClick={generateCaptionedVideo} className="btn-generate">
                ✨ Generate Captioned Video
              </button>
            )}
          </div>
        )}

        {/* STEP 2: LOADER (0-100%) */}
        {loading && (
          <div className="loader-container">
            <div className="spinner"></div>
            <p>{progress < 90 ? `Uploading: ${progress}%` : "AI is burning captions... almost done!"}</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & DOWNLOAD */}
        {videoUrl && (
          <div className="result-container">
            <div className="video-wrapper">
              <video width="100%" controls key={videoUrl}>
                <source src={videoUrl} type="video/mp4" />
              </video>
            </div>
            
            <div className="actions">
              <button onClick={handleDownload} className="btn-download">
                💾 Download Captioned Video
              </button>
              <button onClick={() => {setVideoUrl(""); setFile(null);}} className="btn-outline">
                🔄 Start New Video
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;