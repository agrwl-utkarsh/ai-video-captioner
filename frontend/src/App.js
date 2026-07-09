import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [speaker, setSpeaker] = useState("");
  const [color, setColor] = useState("&H00FFFF");
  const [fontSize, setFontSize] = useState("22");

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

  const generateCaptions = async () => {
    if (!file) return alert("Select a video!");
    setLoading(true);
    setVideoUrl("");
    setProgress(0);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('speaker', speaker);
    formData.append('color', color);
    formData.append('fontSize', fontSize);

    try {
      const res = await axios.post(`${apiBaseUrl}/transcribe`, formData, {
        onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / p.total) * 0.9)
      });
      setVideoUrl(res.data.videoUrl);
      setProgress(100);
    } catch (err) {
      alert("Error: Check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="layout">

        <aside className="sidebar">
          <h3>🎨 Caption Styles</h3>
          <label>Speaker Name</label>
          <input type="text" value={speaker} onChange={(e) => setSpeaker(e.target.value)} placeholder="e.g. Alex" />

          <label>Font Color</label>
          <select value={color} onChange={(e) => setColor(e.target.value)}>
            <option value="&H00FFFF">Yellow</option>
            <option value="&HFFFFFF">White</option>
            <option value="&H00FF00">Green</option>
            <option value="&H0000FF">Red</option>
          </select>

          <label>Font Size</label>
          <input type="range" min="14" max="40" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
          <span>{fontSize}px</span>
        </aside>

        <main className="main-content">
          <div className="glass-card">
            <h1>🎬 AI Video Editor</h1>

            {!loading && !videoUrl && (
              <div className="upload-section">
                <input type="file" id="vid" onChange={(e) => setFile(e.target.files[0])} hidden />
                <label htmlFor="vid" className="dropzone">{file ? `✅ ${file.name}` : "📂 Drop Video Here"}</label>
                {file && <button onClick={generateCaptions} className="btn-main">Generate with Styles</button>}
              </div>
            )}

            {loading && (
              <div className="loader">
                <div className="spinner"></div>
                <p>Engine Working: {Math.round(progress)}%</p>
                <div className="bar"><div className="fill" style={{ width: `${progress}%` }}></div></div>
              </div>
            )}

            {videoUrl && (
              <div className="result">
                <video width="100%" controls key={videoUrl}><source src={videoUrl} type="video/mp4" /></video>
                <div className="btn-group">
                  <button onClick={() => window.open(videoUrl)} className="btn-success">💾 Save Video</button>
                  <button onClick={() => { setVideoUrl(""); setFile(null); }} className="btn-outline">🔄 Reset</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
export default App;
