from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import VarianceThreshold
from sklearn.preprocessing import StandardScaler
import os
import tempfile

app = Flask(__name__)
CORS(app)

# === Load and train model on startup ===
TRAIN_PATH = os.path.join(os.path.dirname(__file__), 'TRAINING.csv')
train_df = pd.read_csv(TRAIN_PATH)

# Clean training data
train_df.replace([np.inf, -np.inf], np.nan, inplace=True)
train_df.dropna(axis=1, how='all', inplace=True)
train_df.fillna(train_df.median(numeric_only=True), inplace=True)

non_feature_cols = ['Label', 'Source IP', 'Destination IP']
feature_cols = [col for col in train_df.columns if col not in non_feature_cols]
X_train = train_df[feature_cols]
y_train = train_df['Label']

selector = VarianceThreshold(threshold=0.0)
X_train_var = selector.fit_transform(X_train)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_var)

clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train_scaled, y_train)

@app.route('/detect-attacks', methods=['POST'])
def detect_attacks():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    try:
        # Save uploaded file to a temp location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as tmp:
            file.save(tmp.name)
            test_df = pd.read_csv(tmp.name)
        os.unlink(tmp.name)

        # Clean test data
        test_df.replace([np.inf, -np.inf], np.nan, inplace=True)
        test_df.dropna(axis=1, how='all', inplace=True)
        test_df.fillna(test_df.median(numeric_only=True), inplace=True)

        # Feature selection/scaling
        X_test = test_df[feature_cols]
        X_test_var = selector.transform(X_test)
        X_test_scaled = scaler.transform(X_test_var)

        # Predict
        y_pred = clf.predict(X_test_scaled)
        test_df['Predicted_Label'] = y_pred

        # Find destination port column
        port_col = None
        for col in test_df.columns:
            if col.strip().lower() == 'destination port':
                port_col = col
                break
        if port_col is not None:
            attack_ports = sorted(set(test_df.loc[test_df['Predicted_Label'] == 1, port_col]))
            return jsonify({'attack_ports': attack_ports})
        else:
            return jsonify({'error': 'Destination Port column not found in test data.'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 