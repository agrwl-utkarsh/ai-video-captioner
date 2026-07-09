import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Advanced Styles
  const [fontColor, setFontColor] = useState("#ffff00");
  const [borderColor, setBorderColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(24);
  const [borderWidth, setBorderWidth] = useState(1);

  const generateCaptions = async () => {
    if (!file) return alert("Select video!");
    setLoading(true);
    setVideoUrl("");

    const formData = new FormData();
    formData.append('video', file);
    formData.append('fontColor', fontColor);
    formData.append('borderColor', borderColor);
    formData.append('fontSize', fontSize);
    formData.append('borderWidth', borderWidth);

    try {
      const res = await axios.post('http://localhost:5000/transcribe', formData, {
        onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / p.total) * 0.9)
      });
      setVideoUrl(res.data.videoUrl);
      setProgress(100);
    } catch (err) { alert("Check backend!"); }
    finally { setLoading(false); }
  };

  return (
    <div className="app-container">
      <div className="layout">
        <aside className="sidebar">
          <h3>🎨 Advanced Styles</h3>
          
          <div className="preview-box">
             <span style={{ 
               fontSize: `${fontSize}px`, 
               color: fontColor,
               textShadow: `0 0 ${borderWidth}px ${borderColor}, 0 0 ${borderWidth}px ${borderColor}`
             }}>Aa</span>
             <p>Live Preview</p>
          </div>

          <label>Font Color</label>
          <input type="color" value={fontColor} onChange={(e)=>setFontColor(e.target.value)} />
          
          <label>Outline Color</label>
          <input type="color" value={borderColor} onChange={(e)=>setBorderColor(e.target.value)} />

          <label>Font Size ({fontSize}px)</label>
          <input type="range" min="12" max="50" value={fontSize} onChange={(e)=>setFontSize(e.target.value)} />
          
          <label>Outline Thickness</label>
          <input type="range" min="0" max="5" step="0.5" value={borderWidth} onChange={(e)=>setBorderWidth(e.target.value)} />
          
          <div className="info-tag">Hindi + English Enabled</div>
        </aside>

        <main className="main-content">
          <div className="glass-card">
            <h1>🎬 AI Smart Captioner</h1>
            
            {!loading && !videoUrl && (
              <div className="upload-section">
                <input type="file" id="vid" onChange={(e)=>setFile(e.target.files[0])} hidden />
                <label htmlFor="vid" className="dropzone">{file ? `✅ ${file.name}` : "📂 Click to Upload Video"}</label>
                {file && <button onClick={generateCaptions} className="btn-main">Burn Smart Captions</button>}
              </div>
            )}

            {loading && (
              <div className="loader">
                <div className="spinner"></div>
                <p>AI Transcribing... {progress}%</p>
                <div className="bar"><div className="fill" style={{width:`${progress}%`}}></div></div>
              </div>
            )}

            {videoUrl && (
              <div className="result">
                <video width="100%" controls key={videoUrl}><source src={videoUrl} type="video/mp4" /></video>
                <div className="btn-group">
                  <button onClick={() => window.open(videoUrl)} className="btn-success">💾 Download Output</button>
                  <button onClick={() => {setVideoUrl(""); setFile(null);}} className="btn-outline">🔄 Reset</button>
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