import os
import subprocess
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import whisper
import datetime

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

print("Loading Whisper AI Model...")
model = whisper.load_model("base")

def format_timestamp(seconds: float):
    td = datetime.timedelta(seconds=seconds)
    total_seconds = int(td.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    millis = int(td.microseconds / 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

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
    output_video_name = f"captioned_{clean_name}.mp4"
    output_video_path = os.path.join(OUTPUT_FOLDER, output_video_name)
    
    file.save(video_path)

    try:
        # Step 1: AI Transcription
        print(f"Processing: {video_filename}")
        result = model.transcribe(video_path)

        # Step 2: Create SRT
        srt_content = ""
        for i, segment in enumerate(result['segments']):
            start = format_timestamp(segment['start'])
            end = format_timestamp(segment['end'])
            text = segment['text'].strip()
            srt_content += f"{i + 1}\n{start} --> {end}\n{text}\n\n"
        
        with open(srt_path, "w", encoding="utf-8") as f:
            f.write(srt_content)

        # Step 3: Burn Subtitles (The Windows Fix)
        safe_srt_path = srt_path.replace('\\', '/').replace(':', '\\:')
        
        # Style: Yellow font, bottom aligned, bold
        cmd = [
            'ffmpeg', '-y', '-i', video_path, 
            '-vf', f"subtitles='{safe_srt_path}':force_style='FontSize=20,PrimaryColour=&H00FFFF,Bold=1,Alignment=2'", 
            '-c:a', 'copy', output_video_path
        ]
        
        process = subprocess.run(cmd, capture_output=True, text=True)
        if process.returncode != 0:
            print("FFmpeg Error:", process.stderr)
            return jsonify({"error": "FFmpeg burning failed"}), 500

        return jsonify({
            "videoUrl": f"{request.host_url}download/{output_video_name}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)