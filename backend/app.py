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

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"--- AI ENGINE: {device.upper()} ---")
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
    speaker_name = request.form.get('speaker', 'Speaker')
    font_color = request.form.get('color', '&H00FFFF')
    font_size = request.form.get('fontSize', '20')

    video_filename = file.filename
    clean_name = "".join([c if c.isalnum() else "_" for c in os.path.splitext(video_filename)[0]])
    video_path = os.path.join(UPLOAD_FOLDER, video_filename)
    srt_path = os.path.join(UPLOAD_FOLDER, f"{clean_name}.srt")
    out_name = f"captioned_{clean_name}.mp4"
    out_path = os.path.join(OUTPUT_FOLDER, out_name)

    file.save(video_path)

    try:
        result = model.transcribe(video_path)
        srt_content = ""
        for i, s in enumerate(result['segments']):
            text = f"{speaker_name}: {s['text'].strip()}" if speaker_name else s['text'].strip()
            srt_content += f"{i+1}\n{format_timestamp(s['start'])} --> {format_timestamp(s['end'])}\n{text}\n\n"

        with open(srt_path, "w", encoding="utf-8") as f:
            f.write(srt_content)

        safe_srt = srt_path.replace('\\', '/').replace(':', '\\:')
        cmd = [
            'ffmpeg', '-y', '-i', video_path,
            '-vf', f"subtitles='{safe_srt}':force_style='FontSize={font_size},PrimaryColour={font_color},Bold=1,Alignment=2'",
            '-c:a', 'copy', out_path
        ]

        process = subprocess.run(cmd, capture_output=True, text=True)
        if process.returncode != 0:
            print("FFmpeg Error:", process.stderr)
            return jsonify({"error": f"FFmpeg burning failed: {process.stderr}"}), 500

        return jsonify({"videoUrl": f"{request.host_url}download/{out_name}"})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
