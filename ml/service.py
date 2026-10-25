import os
import sys
import json
import joblib
from flask import Flask, request, jsonify
from train_model import (
    MODEL_PATH, 
    METRICS_PATH, 
    DB_PATH, 
    train_and_evaluate, 
    predict_single
)

app = Flask(__name__)

# Global model pipeline
pipeline = None

def load_or_train():
    global pipeline
    if os.path.exists(MODEL_PATH):
        try:
            pipeline = joblib.load(MODEL_PATH)
            print("Loaded existing ML pipeline from disk.")
            return
        except Exception as e:
            print("Error loading model, retraining:", e)
    pipeline, _ = train_and_evaluate()

load_or_train()

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "model": "RandomForestClassifier",
        "framework": "scikit-learn 1.9.0",
        "ready": pipeline is not None
    })

@app.route("/metrics", methods=["GET"])
def get_metrics():
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data)
    return jsonify({"error": "Metrics not found"}), 404

@app.route("/predict", methods=["POST"])
def predict():
    global pipeline
    if pipeline is None:
        load_or_train()
    
    student_data = request.json or {}
    try:
        result = predict_single(pipeline, student_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/predict-batch", methods=["POST"])
def predict_batch():
    global pipeline
    if pipeline is None:
        load_or_train()
    
    payload = request.json or {}
    students = payload.get("students", [])
    results = []
    for s in students:
        try:
            pred = predict_single(pipeline, s)
            results.append({**s, **pred})
        except Exception:
            results.append(s)
    return jsonify(results)

@app.route("/retrain", methods=["POST"])
def retrain():
    global pipeline
    try:
        body = request.json or {}
        custom_db = body.get("dbPath", DB_PATH)
        pipeline, metrics = train_and_evaluate(custom_db)
        return jsonify({
            "success": True,
            "message": "Model successfully retrained on current dataset using scikit-learn RandomForestClassifier",
            "metrics": metrics
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    print(f"Starting ML Microservice on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
