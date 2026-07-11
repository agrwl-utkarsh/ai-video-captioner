import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Style Engine States
  const [fontColor, setFontColor] = useState("#ffffff");
  const [borderColor, setBorderColor] = useState("#ff5c35");
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState("Impact");
  const [bgType, setBgType] = useState("1");

  const generateCaptions = async () => {
    if (!file) return;
    setLoading(true);
    setVideoUrl("");
    const formData = new FormData();
    formData.append('video', file);
    formData.append('fontColor', fontColor);
    formData.append('borderColor', borderColor);
    formData.append('fontSize', fontSize);
    formData.append('fontFamily', fontFamily);
    formData.append('bgType', bgType);

    try {
      const res = await axios.post('http://localhost:5000/transcribe', formData, {
        onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / p.total) * 0.9)
      });
      setVideoUrl(res.data.videoUrl);
      setProgress(100);
    } catch (err) { alert("Engine error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="nexgro-site">
      {/* 1. STICKY NAVIGATION */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">NEX<span>GRO</span></div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#engine">The Engine</a>
            <a href="#pricing">Pricing</a>
            <button className="nav-btn">Get Started —</button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <header className="hero">
        <div className="hero-content">
          <div className="badge">AI-POWERED VIDEO ENGINE</div>
          <h1>Growth-Focused <br/><span>AI Captioning</span> For Modern Brands.</h1>
          <p>We help ambitious creators build trust, lead conversions, and scale with data-driven AI subtitling technology.</p>
          <div className="hero-btns">
            <a href="#engine" className="btn-primary">Launch Engine —</a>
            <button className="btn-secondary">View Case Studies</button>
          </div>
        </div>
      </header>

      {/* 3. FEATURE BENTO GRID */}
      <section className="features" id="features">
        <div className="section-header">
          <label>Performance Services</label>
          <h2>Drive Business Growth</h2>
        </div>
        <div className="grid-container">
          <div className="feature-card">
            <div className="card-icon">01</div>
            <h3>AI Transcription</h3>
            <p>Smart Hindi & English detection designed to drive qualified traffic.</p>
          </div>
          <div className="feature-card">
            <div className="card-icon">02</div>
            <h3>Style Presets</h3>
            <p>Create fast, responsive brand styles that deliver exceptional UX.</p>
          </div>
          <div className="feature-card">
            <div className="card-icon">03</div>
            <h3>Smart Rendering</h3>
            <p>Develop content strategy that strengthens your brand messaging.</p>
          </div>
        </div>
      </section>

      {/* 4. THE CAPTIONING ENGINE (THE MAIN TOOL) */}
      <section className="engine-section" id="engine">
        <div className="engine-card">
          <div className="engine-sidebar">
             <h3>Style Engine</h3>
             <div className="control-set">
                <label>Typography</label>
                <select value={fontFamily} onChange={(e)=>setFontFamily(e.target.value)}>
                  <option value="Impact">Impact Bold</option>
                  <option value="Arial Black">Arial Black</option>
                  <option value="Georgia">Serif Modern</option>
                </select>
             </div>
             <div className="control-set">
                <label>Caption Mode</label>
                <div className="toggle-box">
                  <button className={bgType==="1"?"active":""} onClick={()=>setBgType("1")}>Outline</button>
                  <button className={bgType==="3"?"active":""} onClick={()=>setBgType("3")}>Box</button>
                </div>
             </div>
             <div className="control-set">
                <label>Scale: {fontSize}px</label>
                <input type="range" min="16" max="60" value={fontSize} onChange={(e)=>setFontSize(e.target.value)} />
             </div>
             <div className="color-row">
                <div><label>Text</label><input type="color" value={fontColor} onChange={(e)=>setFontColor(e.target.value)} /></div>
                <div><label>Accent</label><input type="color" value={borderColor} onChange={(e)=>setBorderColor(e.target.value)} /></div>
             </div>
          </div>

          <div className="engine-main">
            {!loading && !videoUrl && (
              <div className="upload-box">
                <div className="upload-ui">
                  <input type="file" id="v-file" onChange={(e)=>setFile(e.target.files[0])} hidden />
                  <label htmlFor="v-file">
                    {file ? file.name : "Click to select master file"}
                  </label>
                </div>
                {file && <button onClick={generateCaptions} className="btn-render">Start Rendering —</button>}
              </div>
            )}

            {loading && (
              <div className="rendering-ui">
                <div className="pulse-loader"></div>
                <h3>SYSTEM PROCESSING...</h3>
                <div className="progress-track"><div className="progress-bar" style={{width:`${progress}%`}}></div></div>
              </div>
            )}

            {videoUrl && (
              <div className="output-ui">
                <video width="100%" controls key={videoUrl}><source src={videoUrl} type="video/mp4" /></video>
                <div className="btn-row">
                  <button onClick={() => window.open(videoUrl)} className="btn-download">Download Master</button>
                  <button onClick={() => {setVideoUrl(""); setFile(null);}} className="btn-reset">New Project</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <div className="logo">NEX<span>GRO</span></div>
          <p>© 2026 Nexgro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;