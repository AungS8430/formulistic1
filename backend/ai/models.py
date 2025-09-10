from typing import Tuple
from keras import Sequential
from keras.layers import LSTM, Dense, Dropout, BatchNormalization
from keras.optimizers import Adam
import keras


def build_model(
    input_shape: Tuple[int, int],
    units1: int = 128,
    units2: int = 64,
    dropout: float = 0.2,
    lr: float = 1e-3
    ):
    model = Sequential([
        LSTM(units1, return_sequences=True, input_shape=input_shape),
        Dropout(dropout),
        BatchNormalization(),
        LSTM(units2, return_sequences=False),
        Dropout(dropout),
        BatchNormalization(),
        Dense(64, activation="relu"),
        Dropout(dropout),
        Dense(1),  # predict scaled LapTime_seconds
    ])
    model.compile(optimizer=Adam(learning_rate=lr), loss="mse", metrics=["mae", keras.metrics.RootMeanSquaredError("rmse")])  # pyright: ignore
    return model

def chronological_splits(X, y, train_ratio=0.7, val_ratio=0.15):
    n = len(X)
    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))
    X_train, y_train = X[:train_end], y[:train_end]
    X_val, y_val = X[train_end:val_end], y[train_end:val_end]
    X_test, y_test = X[val_end:], y[val_end:]
    return (X_train, y_train), (X_val, y_val), (X_test, y_test)
