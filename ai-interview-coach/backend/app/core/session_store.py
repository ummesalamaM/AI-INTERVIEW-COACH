from typing import Dict, Any
import uuid

# In production, replace with Redis
_sessions: Dict[str, Any] = {}

def create_session(data: dict) -> str:
    session_id = str(uuid.uuid4())
    _sessions[session_id] = data
    return session_id

def get_session(session_id: str) -> dict:
    return _sessions.get(session_id, {})

def update_session(session_id: str, data: dict):
    if session_id in _sessions:
        _sessions[session_id].update(data)

def delete_session(session_id: str):
    _sessions.pop(session_id, None)
