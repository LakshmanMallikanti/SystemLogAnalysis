import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import VarianceThreshold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score

# Load data
train_df = pd.read_csv('C:/Users/laksh/Desktop/LogAnalysisProject/LogAnalysisProject/TRAINING.csv')
test_df = pd.read_csv('C:/Users/laksh/Desktop/LogAnalysisProject/LogAnalysisProject/TRAINING.csv')

# Data purification: Replace inf/-inf with NaN, then fill or drop
train_df.replace([np.inf, -np.inf], np.nan, inplace=True)
test_df.replace([np.inf, -np.inf], np.nan, inplace=True)

# Drop columns with all NaN values
train_df.dropna(axis=1, how='all', inplace=True)
test_df.dropna(axis=1, how='all', inplace=True)

# Fill remaining NaN with column median (robust to outliers)
train_df.fillna(train_df.median(numeric_only=True), inplace=True)
test_df.fillna(test_df.median(numeric_only=True), inplace=True)

# Remove non-feature columns
non_feature_cols = ['Label', 'Source IP', 'Destination IP']
feature_cols = [col for col in train_df.columns if col not in non_feature_cols]

X_train = train_df[feature_cols]
y_train = train_df['Label']
X_test = test_df[feature_cols]

# Remove low-variance features
selector = VarianceThreshold(threshold=0.0)
X_train_var = selector.fit_transform(X_train)
X_test_var = selector.transform(X_test)

# Standardize features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_var)
X_test_scaled = scaler.transform(X_test_var)

# Train model
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train_scaled, y_train)

# Predict and score
if 'Label' in test_df.columns:
    y_test = test_df['Label']
    y_pred = clf.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    print(f'Accuracy on test set: {acc:.4f}')
    # Output destination ports where attacks are detected
    test_df['Predicted_Label'] = y_pred
    # Try both 'Destination Port' and ' Destination Port' (with leading space)
    port_col = None
    for col in test_df.columns:
        if col.strip().lower() == 'destination port':
            port_col = col
            break
    if port_col is not None:
        attack_ports = sorted(set(test_df.loc[test_df['Predicted_Label'] == 1, port_col]))
        print('Destination ports where attacks were detected:', attack_ports)
    else:
        print('Destination Port column not found in test data.')
else:
    print('No true labels in test set; accuracy cannot be computed.') 