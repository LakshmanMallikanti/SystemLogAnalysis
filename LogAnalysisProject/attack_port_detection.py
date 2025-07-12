import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import VarianceThreshold
from sklearn.preprocessing import StandardScaler

# === Step 1: Load data ===
train_df = pd.read_csv('C:/Users/laksh/Desktop/LogAnalysisProject/LogAnalysisProject/TRAINING.csv')
test_df = pd.read_csv('C:/Users/laksh/Desktop/LogAnalysisProject/LogAnalysisProject/Testing.csv')

# === Step 2: Clean data ===
for df in [train_df, test_df]:
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.dropna(axis=1, how='all', inplace=True)
    df.fillna(df.median(numeric_only=True), inplace=True)

# === Step 3: Feature/label split ===
non_feature_cols = ['Label', 'Source IP', 'Destination IP']
feature_cols = [col for col in train_df.columns if col not in non_feature_cols]

X_train = train_df[feature_cols]
y_train = train_df['Label']
X_test = test_df[feature_cols]

# === Step 4: Feature selection + scaling ===
selector = VarianceThreshold(threshold=0.0)
X_train_var = selector.fit_transform(X_train)
X_test_var = selector.transform(X_test)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_var)
X_test_scaled = scaler.transform(X_test_var)

# === Step 5: Train model ===
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train_scaled, y_train)

# === Step 6: Predict attacks in test set ===
y_pred = clf.predict(X_test_scaled)
test_df['Predicted_Label'] = y_pred

# Find the correct destination port column (robust to spaces/case)
port_col = None
for col in test_df.columns:
    if col.strip().lower() == 'destination port':
        port_col = col
        break

if port_col is not None:
    attack_ports = sorted(set(test_df.loc[test_df['Predicted_Label'] == 1, port_col]))
    print('Destination ports where attacks were detected:', attack_ports)
    # Save to CSV
    pd.DataFrame({"Destination Port": attack_ports}).to_csv("detected_attack_ports.csv", index=False)
    print('Saved detected attack ports to detected_attack_ports.csv')
else:
    print('Destination Port column not found in test data.')
