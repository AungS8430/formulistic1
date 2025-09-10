import os
import json
import argparse
import random
import numpy as np
import tensorflow as tf
import datetime
from pathlib import Path
from keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, CSVLogger

from models import chronological_splits, build_model
from feature_engineering import preprocess_f1_data


SEED = 42
random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)


def train():
    parser = argparse.ArgumentParser(description="Train LSTM for F1 lap prediction")
    parser.add_argument("--years", nargs="+", type=int, default=[2018, 2019, 2020, 2021, 2022, 2023, 2024], help="Seasons to include")
    parser.add_argument("--gps", nargs="+", type=int, default=[x for x in range(1, 25)], help="Grand Prix list")
    parser.add_argument("--current_year", type=int, default=15, help="Number of Grand Prix to include from this year")
    parser.add_argument("--timesteps", type=int, default=10, help="Sequence length for LSTM")
    parser.add_argument("--batch_size", type=int, default=64, help="Batch size")
    parser.add_argument("--epochs", type=int, default=50, help="Max epochs")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate")
    parser.add_argument("--units1", type=int, default=128, help="First LSTM layer units")
    parser.add_argument("--units2", type=int, default=64, help="Second LSTM layer units")
    parser.add_argument("--dropout", type=float, default=0.2, help="Dropout rate")
    parser.add_argument("--artifacts_dir", type=str, default="artifacts", help="Where to save the model and logs")
    args = parser.parse_args()

    ts = datetime.datetime.now(datetime.UTC).strftime("%Y%m%d-%H%M%S")
    run_dir = Path(args.artifacts_dir) / f"lstm_run_{ts}"
    run_dir.mkdir(parents=True, exist_ok=True)

    print("Preprocessing data...")
    X, y, scaler, df = preprocess_f1_data(args.years, args.gps, args.current_year)
    print(f"Data ready: X={X.shape}, y={y.shape}")

    (X_train, y_train), (X_val, y_val), (X_test, y_test) = chronological_splits(X, y)

    timesteps, n_features = X_train.shape[1], X_train.shape[2]
    model = build_model(
        input_shape=(timesteps, n_features),
        units1=args.units1,
        units2=args.units2,
        dropout=args.dropout,
        lr=args.lr,
    )
    model.summary(print_fn=lambda x: print(x))

    ckpt_path = run_dir / "best_model.keras"
    callbacks = [
        EarlyStopping(monitor="val_loss", patience=8, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=4, min_lr=1e-6, verbose=1),
        ModelCheckpoint(ckpt_path.as_posix(), monitor="val_loss", save_best_only=True, verbose=1),
        CSVLogger((run_dir / "training_log.csv").as_posix())
    ]

    #training sigma model
    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        batch_size=args.batch_size,
        epochs=args.epochs,
        callbacks=callbacks,
        verbose=1, # pyright: ignore
    )

    print("Evaluating best model on test set...")
    test_metrics = model.evaluate(X_test, y_test)
    metric_names = model.metrics_names
    test_results = {name: float(val) for name, val in zip(metric_names, test_metrics)}
    print("Test metrics:", test_results)

    #save
    model.save((run_dir / "final_model.keras").as_posix())

    try:
        import joblib
        joblib.dump(scaler, (run_dir / "scaler.joblib").as_posix())
    except Exception as e:
        print("Warning: could not save scaler:", e)

    config = vars(args)
    with open(run_dir / "config.json", "w") as f:
        json.dump(config, f, indent=2)
    with open(run_dir / "test_metrics.json", "w") as f:
        json.dump(test_results, f, indent=2)
    print(f"Artifacts saved to: {run_dir.resolve()}")


if __name__ == "__main__":
    try:
        gpus = tf.config.experimental.list_physical_devices('GPU')
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    except Exception:
        pass
    train()
