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

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')

def startup_cleanup():
    for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER]:
        if os.path.exists(folder):
            shutil.rmtree(folder)
        os.makedirs(folder)

startup_cleanup()

# Load Whisper - Optimized for Hindi + English
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"--- AI ENGINE: {device.upper()} (Hindi/English Support) ---")
model = whisper.load_model("base", device=device)

def web_to_ffmpeg_color(web_hex):
    """Converts #RRGGBB to FFmpeg's &H00BBGGRR format"""
    hex_val = web_hex.lstrip('#')
    r, g, b = hex_val[0:2], hex_val[2:4], hex_val[4:6]
    return f"&H00{b}{g}{r}"

def format_timestamp(seconds: float):
    td = datetime.timedelta(seconds=seconds)
    ts = int(td.total_seconds())
    return f"{ts//3600:02d}:{(ts%3600)//60:02d}:{ts%60:02d},{int(td.microseconds/1000):03d}"

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(OUTPUT_FOLDER, filename, as_attachment=True)

@app.route('/transcribe', methods=['POST'])
def transcribe():
    file = request.files['video']
    
    # Advanced Styles from UI
    f_color = web_to_ffmpeg_color(request.form.get('fontColor', '#FFFF00'))
    b_color = web_to_ffmpeg_color(request.form.get('borderColor', '#000000'))
    f_size = request.form.get('fontSize', '24')
    b_width = request.form.get('borderWidth', '1')
    
    video_filename = file.filename
    clean_name = "".join([c if c.isalnum() else "_" for c in os.path.splitext(video_filename)[0]])
    video_path = os.path.join(UPLOAD_FOLDER, video_filename)
    srt_path = os.path.join(UPLOAD_FOLDER, f"{clean_name}.srt")
    out_name = f"captioned_{clean_name}.mp4"
    out_path = os.path.join(OUTPUT_FOLDER, out_name)
    
    file.save(video_path)

    try:
        # Multilingual transcription
        result = model.transcribe(video_path)
        
        srt_content = ""
        for i, s in enumerate(result['segments']):
            text = s['text'].strip()
            srt_content += f"{i+1}\n{format_timestamp(s['start'])} --> {format_timestamp(s['end'])}\n{text}\n\n"
        
        with open(srt_path, "w", encoding="utf-8") as f:
            f.write(srt_content)

        # Advanced FFmpeg Styling
        style_str = (
            f"FontSize={f_size},PrimaryColour={f_color},OutlineColour={b_color},"
            f"BorderStyle=1,Outline={b_width},Shadow=1,Alignment=2,Bold=1"
        )
        
        safe_srt = srt_path.replace('\\', '/').replace(':', '\\:')
        cmd = [
            'ffmpeg', '-y', '-i', video_path, 
            '-vf', f"subtitles='{safe_srt}':force_style='{style_str}'", 
            '-c:a', 'copy', out_path
        ]
        
        subprocess.run(cmd, check=True)
        return jsonify({"videoUrl": f"http://localhost:5000/download/{out_name}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)