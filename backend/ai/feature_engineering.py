import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from data_collection import collect_race_data
from feature_sch import FEATURE_NAME


CURRENT_YEAR = 2025


class Preprocessor:
    def __init__(self):
        self.scalers = {}
        self.encoders = {}

    def create_track_features(self, laps_df):
        track_encoder = LabelEncoder()
        laps_df["Track_encoded"] = track_encoder.fit_transform(laps_df["TrackID"])
        self.encoders["TrackID"] = track_encoder
        return laps_df

    def create_tyre_features(self, laps_df):
        laps_df["TyreAge"] = laps_df.groupby(["DriverNumber", "Stint"]).cumcount() + 1
        tyre_encoder = LabelEncoder()
        laps_df["TyreCompound_encoded"] = tyre_encoder.fit_transform(laps_df["Compound"])
        self.encoders["tyre_compound"] = tyre_encoder
        laps_df["TyreDegradation"] = laps_df.groupby(['DriverNumber', 'Stint'])['LapTime'].diff()
        laps_df["TyreDegradation"] = laps_df['TyreDegradation'].dt.total_seconds()
        return laps_df

    def create_weather_features(self, laps_df, weather_df):
        laps_df['Time'] = laps_df['Time'].dt.total_seconds()
        weather_df['Time'] = weather_df['Time'].dt.total_seconds()
        merged_df = pd.merge_asof(
            laps_df.sort_values('Time'),
            weather_df.sort_values('Time'),
            on='Time',
            direction='nearest'
        )
        merged_df['TrackTemp_change'] = merged_df.groupby('DriverNumber')['TrackTemp'].diff()
        merged_df['AirTemp_change'] = merged_df.groupby('DriverNumber')['AirTemp'].diff()
        merged_df['Humidity_change'] = merged_df.groupby('DriverNumber')['Humidity'].diff()
        rainfall_encoder = LabelEncoder()
        merged_df["Rainfall_encoded"] = rainfall_encoder.fit_transform(merged_df["Rainfall"])
        self.encoders["Rainfall"] = rainfall_encoder
        return merged_df

    def create_position_features(self, df):
        df['PositionChange'] = df.groupby('DriverNumber')['Position'].diff()
        df['GapToLeader_seconds'] = pd.to_timedelta(df['LapTime']).dt.total_seconds()
        df['LapTime_rolling_3'] = df.groupby('DriverNumber')['GapToLeader_seconds'].rolling(3).mean().reset_index(0, drop=True)
        df['LapTime_rolling_5'] = df.groupby('DriverNumber')['GapToLeader_seconds'].rolling(5).mean().reset_index(0, drop=True)
        return df

    def create_strategic_features(self, df):
        df['PitOutLap'] = df['PitOutTime'].notna().astype(int)
        df['PitInLap'] = df['PitInTime'].notna().astype(int)
        df['StintLength'] = df.groupby(['DriverNumber', 'Stint']).cumcount() + 1
        df['LapsSincePit'] = df.groupby('DriverNumber').apply(
            lambda x: x['LapNumber'] - x[x['PitOutLap'] == 1]['LapNumber'].shift(1).fillna(0)
        ).reset_index(0, drop=True)
        return df


def clean_and_normalize_data(df):
    df = df[df['LapTime'].notna()]
    df['LapTime_seconds'] = pd.to_timedelta(df['LapTime']).dt.total_seconds()
    df = df[(df['LapTime_seconds'] > 60) & (df['LapTime_seconds'] < 120)]
    numeric_columns = df.select_dtypes(include=[np.number]).columns
    df[numeric_columns] = df[numeric_columns].fillna(df[numeric_columns].median())
    scaler = StandardScaler()
    features_to_scale = [
        'LapTime_seconds', 'TrackTemp', 'AirTemp', 'Humidity',
        'TyreAge', 'SpeedI1', 'SpeedI2', 'SpeedFL', 'Position'
    ]
    df[features_to_scale] = scaler.fit_transform(df[features_to_scale])
    return df, scaler


def create_lstm_sequences(df, sequence_length=10, target_column='LapTime_seconds'):
    sequences = []
    targets = []
    for driver in df['DriverNumber'].unique():
        driver_data = df[df['DriverNumber'] == driver].sort_values('LapNumber')
        if len(driver_data) < sequence_length + 1:
            continue
        feature_columns = FEATURE_NAME
        features = driver_data[feature_columns].values
        for i in range(len(features) - sequence_length):
            sequences.append(features[i:i + sequence_length])
            targets.append(features[i + sequence_length][0])  # Predict next lap time
    return np.array(sequences), np.array(targets)


def preprocess_f1_data(years, grand_prix_list, current_year_gp):
    selected_grand_prixs = []
    all_data = []
    for year in years:
        for gp in grand_prix_list:
            selected_grand_prixs.append((year, gp))
    for gp in range(1, current_year_gp):
        selected_grand_prixs.append((CURRENT_YEAR, gp))
    for year, gp in selected_grand_prixs:
        print(f"Processing {year} {gp}...")
        try:
            race_data, weather, session = collect_race_data(year, gp)
            preprocessor = Preprocessor()
            race_data = preprocessor.create_tyre_features(race_data)
            race_data = preprocessor.create_weather_features(race_data, weather)
            race_data = preprocessor.create_position_features(race_data)
            race_data = preprocessor.create_strategic_features(race_data)
            race_data = preprocessor.create_track_features(race_data)
            all_data.append(race_data)
        except Exception as e:
            print(f"Error processing {year} {gp}: {e}")
            continue
    combined_df = pd.concat(all_data, ignore_index=True)
    processed_df, scaler = clean_and_normalize_data(combined_df)
    X, y = create_lstm_sequences(processed_df)
    return X, y, scaler, processed_df
