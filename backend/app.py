from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import re

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "recordings"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def sanitize_filename(text):
    
    return re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-")

@app.route("/upload", methods=["POST"])
def upload():
    try:
        audio = request.files.get("audio")
        if not audio:
            return jsonify({"error": "Aucun fichier audio reçu"}), 400

        age = request.form.get("age")
        gender = request.form.get("gender")
        consent = request.form.get("consent")
        sentence = request.form.get("sentence")
        sentence_index = request.form.get("sentenceIndex")

        # Sécurité et horodatage
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        sentence_clean = sanitize_filename(sentence or "inconnue")
        gender_clean = sanitize_filename(gender or "inconnu")
        age_clean = sanitize_filename(age or "xx")

        filename = f"{age_clean}_{gender_clean}_{sentence_clean}_{timestamp}.webm"
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        # Sauvegarde du fichier
        audio.save(file_path)

        # Ajout au journal
        with open(os.path.join(UPLOAD_FOLDER, "log.txt"), "a") as log:
            log.write(f"{filename} | phrase #{sentence_index} | consentement: {consent}\n")

        return jsonify({"status": "success"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
