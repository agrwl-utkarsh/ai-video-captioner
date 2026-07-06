import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
from moviepy.editor import VideoFileClip
import datetime

app = Flask(__name__)
CORS(app) # This allows your React app to talk to this Python app

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load the AI model (using "base" for a balance of speed and accuracy)
print("Loading AI Model...")
model = whisper.load_model("base")

def format_timestamp(seconds: float):
    """Converts seconds (1.5) to SRT format (00:00:01,500)"""
    td = datetime.timedelta(seconds=seconds)
    total_seconds = int(td.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    millis = int(td.microseconds / 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'video' not in request.files:
        return jsonify({"error": "No video file found"}), 400
    
    file = request.files['video']
    video_path = os.path.join(UPLOAD_FOLDER, file.filename)
    audio_path = os.path.join(UPLOAD_FOLDER, "temp_audio.mp3")
    
    # Save the uploaded video
    file.save(video_path)

    try:
        # 1. Extract Audio from the video file
        video = VideoFileClip(video_path)
        video.audio.write_audiofile(audio_path, codec='libmp3lame', verbose=False, logger=None)
        video.close()

        # 2. Run the AI Transcription
        print("AI is transcribing...")
        result = model.transcribe(audio_path)

        # 3. Format the result into an SRT (Subtitle) file string
        srt_content = ""
        for i, segment in enumerate(result['segments']):
            start = format_timestamp(segment['start'])
            end = format_timestamp(segment['end'])
            text = segment['text'].strip()
            srt_content += f"{i + 1}\n{start} --> {end}\n{text}\n\n"

        return jsonify({"srt": srt_content})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up the audio file to save space
        if os.path.exists(audio_path):
            os.remove(audio_path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)