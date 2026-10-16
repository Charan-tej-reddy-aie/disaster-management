import pandas as pd
import numpy as np


def preprocess_weather(weather_data):
    """
    Convert raw weather observation into ML-ready features.
    """

    df = pd.DataFrame([weather_data])

    numeric_columns = [
        "temperature",
        "rainfall",
        "humidity",
        "wind_speed",
        "wind_direction",
        "pressure"
    ]

    for column in numeric_columns:
        if column in df.columns:
            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

    df = df.fillna(0)

    return df


def create_weather_features(df):
    """
    Create additional features useful for disaster prediction.
    """

    df["rainfall_intensity"] = df["rainfall"]

    df["high_humidity"] = (
        df["humidity"] >= 80
    ).astype(int)

    df["high_wind"] = (
        df["wind_speed"] >= 40
    ).astype(int)

    df["low_pressure"] = (
        df["pressure"] <= 1000
    ).astype(int)

    return df


def prepare_weather_data(weather_data):

    df = preprocess_weather(weather_data)

    df = create_weather_features(df)

    return df