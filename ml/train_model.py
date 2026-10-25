import os
import sys
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
DB_PATH = os.path.join(PROJECT_ROOT, "src", "data", "students-db.json")
MODEL_PATH = os.path.join(BASE_DIR, "model.joblib")
METRICS_PATH = os.path.join(BASE_DIR, "metrics.json")

NUM_FEATURES = ["attendance", "internalMarks", "cgpa", "householdIncome"]
CAT_FEATURES = ["department", "academicYear", "engagement", "scholarship"]

def load_data(db_path=DB_PATH):
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database not found at {db_path}")
    with open(db_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    
    # Ensure types
    for col in NUM_FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    
    df["scholarship"] = df["scholarship"].astype(str)
    df["engagement"] = df["engagement"].fillna("Medium").astype(str)
    df["department"] = df["department"].fillna("General").astype(str)
    df["academicYear"] = df["academicYear"].fillna("Freshman").astype(str)
    
    # Target: Multi-class Risk Level
    if "riskLevel" not in df.columns:
        # If not present, infer from riskScore
        df["riskLevel"] = df["riskScore"].apply(lambda s: "High" if s >= 45 else ("Medium" if s >= 25 else "Low"))
        
    return df

def train_and_evaluate(db_path=DB_PATH):
    df = load_data(db_path)
    print(f"Loaded {len(df)} student records for training.")

    X = df[NUM_FEATURES + CAT_FEATURES]
    y = df["riskLevel"]

    # Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUM_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CAT_FEATURES)
        ]
    )

    # Scikit-learn Random Forest Classifier
    rf = RandomForestClassifier(
        n_estimators=120,
        max_depth=8,
        min_samples_split=4,
        random_state=42,
        class_weight="balanced"
    )

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", rf)
    ])

    # 80-20 Stratified train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)

    # Convert the target labels to binary:
    # High risk = 1, all other risk categories = 0
    y_test_binary = (y_test == "High").astype(int)
    y_pred_binary = (y_pred == "High").astype(int)

    # Confusion matrix derived exclusively from held-out test predictions
    tn, fp, fn, tp = confusion_matrix(
        y_test_binary,
        y_pred_binary,
        labels=[0, 1]
    ).ravel()

    # Calculate metrics without intermediate rounding using scikit-learn functions
    accuracy = accuracy_score(
        y_test_binary, y_pred_binary
    ) * 100

    precision = precision_score(
        y_test_binary, y_pred_binary, zero_division=0
    ) * 100

    recall = recall_score(
        y_test_binary, y_pred_binary, zero_division=0
    ) * 100

    f1 = f1_score(
        y_test_binary, y_pred_binary, zero_division=0
    ) * 100

    test_samples_count = len(y_test)

    # Extract Feature Importances from Random Forest
    rf_model = pipeline.named_steps["classifier"]
    cat_encoder = pipeline.named_steps["preprocessor"].named_transformers_["cat"]
    encoded_cat_names = cat_encoder.get_feature_names_out(CAT_FEATURES).tolist()
    all_feature_names = NUM_FEATURES + encoded_cat_names
    raw_importances = rf_model.feature_importances_

    # Aggregate importance by source feature group
    group_importances = {
        "Cumulative GPA": 0.0,
        "Attendance Rate": 0.0,
        "Internal Marks": 0.0,
        "Household Income": 0.0,
        "Engagement": 0.0,
        "Scholarship": 0.0,
        "Department": 0.0,
        "Academic Year": 0.0,
    }

    for name, imp in zip(all_feature_names, raw_importances):
        if name == "cgpa":
            group_importances["Cumulative GPA"] += imp
        elif name == "attendance":
            group_importances["Attendance Rate"] += imp
        elif name == "internalMarks":
            group_importances["Internal Marks"] += imp
        elif name == "householdIncome":
            group_importances["Household Income"] += imp
        elif name.startswith("engagement_"):
            group_importances["Engagement"] += imp
        elif name.startswith("scholarship_"):
            group_importances["Scholarship"] += imp
        elif name.startswith("department_"):
            group_importances["Department"] += imp
        elif name.startswith("academicYear_"):
            group_importances["Academic Year"] += imp

    total_imp = sum(group_importances.values()) or 1.0
    feature_weights = [
        {
            "feature": feat,
            "weight": round((val / total_imp) * 100, 1),
            "impact": f"Learned Random Forest MDI Feature Importance ({round((val / total_imp) * 100, 1)}%)"
        }
        for feat, val in sorted(group_importances.items(), key=lambda x: x[1], reverse=True)
    ]

    metrics = {
        "modelName": "RandomForestClassifier",
        "algorithm": "Scikit-Learn Random Forest (120 Trees, Stratified 80/20 Train-Test Split)",
        "taskDescription": "Student Retention Risk-Category Prediction",
        "framework": "scikit-learn 1.9.0",
        "evaluationScope": "Held-out Test Performance",
        "trainedAt": pd.Timestamp.now().isoformat(),
        "totalDatasetRecords": len(df),
        "trainSamples": len(X_train),
        "testSamples": len(y_test),
        "accuracy": round(accuracy, 1),
        "precision": round(precision, 1),
        "recall": round(recall, 1),
        "f1Score": round(f1, 1),
        "confusionMatrix": {
            "truePositive": int(tp),
            "falsePositive": int(fp),
            "trueNegative": int(tn),
            "falseNegative": int(fn)
        },
        "featureWeights": feature_weights
    }

    # Save artifacts
    os.makedirs(BASE_DIR, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"Model saved to {MODEL_PATH}")
    print(f"Metrics saved to {METRICS_PATH}")
    print(f"Held-out Test Performance (N={test_samples_count}): Accuracy: {metrics['accuracy']}%, Precision: {metrics['precision']}%, Recall: {metrics['recall']}%, F1: {metrics['f1Score']}%")
    print(f"Confusion Matrix (Test Split): TP={tp}, FP={fp}, FN={fn}, TN={tn}")
    return pipeline, metrics

def predict_single(pipeline, student_dict):
    df_row = pd.DataFrame([{
        "attendance": float(student_dict.get("attendance", 0)),
        "internalMarks": float(student_dict.get("internalMarks", 0)),
        "cgpa": float(student_dict.get("cgpa", 0)),
        "householdIncome": float(student_dict.get("householdIncome", 0)),
        "department": str(student_dict.get("department", "General")),
        "academicYear": str(student_dict.get("academicYear", "Freshman")),
        "engagement": str(student_dict.get("engagement", "Medium")),
        "scholarship": str(student_dict.get("scholarship", False))
    }])

    # Classes in pipeline
    classes = list(pipeline.classes_)
    proba = pipeline.predict_proba(df_row)[0]
    proba_map = {cls_name: float(prob) for cls_name, prob in zip(classes, proba)}
    
    high_risk_prob = proba_map.get("High", 0.0)
    med_risk_prob = proba_map.get("Medium", 0.0)
    low_risk_prob = proba_map.get("Low", 0.0)

    # Calibrated risk score (0-100 scale based on weighted class probabilities)
    # High risk probability carries 100 weight, Medium carries 40 weight, Low carries 5 weight
    raw_risk_score = (high_risk_prob * 100) + (med_risk_prob * 40) + (low_risk_prob * 5)
    risk_score = int(round(np.clip(raw_risk_score, 0, 100)))

    # Determine risk level from ML model prediction
    predicted_level = pipeline.predict(df_row)[0]
    
    # Harmonize with threshold boundaries for safety
    if risk_score >= 45:
        risk_level = "High"
        status = "Risk of Dropout"
    elif risk_score >= 25:
        risk_level = "Medium"
        status = "Active"
    else:
        risk_level = "Low"
        status = "Enrolled"

    # Identify active drivers from feature thresholds
    drivers = []
    cgpa = float(student_dict.get("cgpa", 0))
    attendance = float(student_dict.get("attendance", 0))
    internalMarks = float(student_dict.get("internalMarks", 0))
    householdIncome = float(student_dict.get("householdIncome", 0))
    engagement = str(student_dict.get("engagement", "Medium"))

    if cgpa < 7.5:
        drivers.append(f"Academic Alert: Low CGPA ({cgpa:.2f}/10)")
    if attendance < 80:
        drivers.append(f"Attendance Alert: Low Attendance ({attendance:.1f}%)")
    if internalMarks < 70:
        drivers.append(f"Assessment Alert: Low Internal Marks ({internalMarks:.1f}%)")
    if householdIncome < 30000:
        drivers.append(f"Financial Stress: Low Household Income (${householdIncome:,.0f})")
    if engagement == "Low":
        drivers.append("Engagement Alert: Minimal co-curricular participation")

    return {
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "status": status,
        "predictedClass": predicted_level,
        "probabilities": proba_map,
        "activeDrivers": drivers,
        "isMlGenerated": True,
        "modelName": "RandomForestClassifier (scikit-learn)"
    }

if __name__ == "__main__":
    train_and_evaluate()
