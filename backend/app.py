import os
import subprocess
import shutil
import torch
import whisper
import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Paths setup
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')

def startup_cleanup():
    """Wipe old files so local disk stays clean"""
    for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER]:
        if os.path.exists(folder):
            shutil.rmtree(folder)
        os.makedirs(folder)

startup_cleanup()

# Check for GPU (Speed optimization)
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"--- AI ENGINE STARTING ON: {device.upper()} ---")
model = whisper.load_model("base", device=device)

def format_timestamp(seconds: float):
    td = datetime.timedelta(seconds=seconds)
    ts = int(td.total_seconds())
    return f"{ts//3600:02d}:{(ts%3600)//60:02d}:{ts%60:02d},{int(td.microseconds/1000):03d}"

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(OUTPUT_FOLDER, filename, as_attachment=True)

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'video' not in request.files:
        return jsonify({"error": "No file"}), 400
    
    file = request.files['video']
    video_filename = file.filename
    clean_name = "".join([c if c.isalnum() else "_" for c in os.path.splitext(video_filename)[0]])
    
    video_path = os.path.join(UPLOAD_FOLDER, video_filename)
    srt_path = os.path.join(UPLOAD_FOLDER, f"{clean_name}.srt")
    out_name = f"captioned_{clean_name}.mp4"
    out_path = os.path.join(OUTPUT_FOLDER, out_name)
    
    file.save(video_path)

    try:
        print(f"--- AI Processing: {video_filename} ---")
        result = model.transcribe(video_path)

        srt_content = ""
        for i, s in enumerate(result['segments']):
            srt_content += f"{i+1}\n{format_timestamp(s['start'])} --> {format_timestamp(s['end'])}\n{s['text'].strip()}\n\n"
        
        with open(srt_path, "w", encoding="utf-8") as f:
            f.write(srt_content)

        # Windows Path Fix for FFmpeg
        safe_srt = srt_path.replace('\\', '/').replace(':', '\\:')
        
        cmd = [
            'ffmpeg', '-y', '-i', video_path, 
            '-vf', f"subtitles='{safe_srt}':force_style='FontSize=22,PrimaryColour=&H00FFFF,Bold=1'", 
            '-c:a', 'copy', out_path
        ]
        
        subprocess.run(cmd, check=True)
        print(f"--- Successfully created: {out_name} ---")
        return jsonify({"videoUrl": f"http://localhost:5000/download/{out_name}"})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
