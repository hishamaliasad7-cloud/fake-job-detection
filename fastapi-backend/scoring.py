import math
from typing import Dict, TypedDict

def calculate_energy_sink_score(effort_metrics: dict, response_signals: list) -> dict:
    """
    Exact Sink Score Formula (AESD System):
    Score = (Weighted Effort / Max(1, Meaningful Responses)) * 10
    """
    # Weights for Effort
    W_TIME = 0.4    # Minutes spent
    W_FIELDS = 0.3  # Number of manual fields
    W_REDIRECTIONS = 0.2 # ATS redirect count
    W_UPLOADS = 0.1 # Resume/Cover Letter uploads

    # Calculate Raw Effort
    raw_effort = (
        (effort_metrics.get("time_spent", 0) * W_TIME) +
        (effort_metrics.get("fields_filled", 0) * W_FIELDS) +
        (effort_metrics.get("ats_redirects", 0) * W_REDIRECTIONS) +
        (effort_metrics.get("uploads", 0) * W_UPLOADS)
    )

    # Calculate Response Value
    # Responses reduce the sink score because they represent outcome
    response_value = 0
    for sig in response_signals:
        if sig["type"] == "INTERVIEW": response_value += 10
        if sig["type"] == "REJECTION": response_value += 2
        if sig["type"] == "ACK": response_value += 0.5
    
    # Formula: High effort + Zero response = High Sink
    # Normalizing to 0-100
    sink_score = min(100, (raw_effort / max(1, response_value)) * 10)

    recommendation = "Apply"
    if sink_score > 75: recommendation = "Avoid"
    elif sink_score > 40: recommendation = "Caution"

    return {
        "score": round(sink_score, 1),
        "raw_effort": round(raw_effort, 1),
        "response_value": response_value,
        "recommendation": recommendation,
        "alert": sink_score > 80
    }
