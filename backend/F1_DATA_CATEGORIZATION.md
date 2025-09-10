# F1 Live Timing Data Categorization

This document explains how the F1 live race data from `saved_data.txt` has been categorized and organized into structured race data.

## Data Categories

The F1 live timing data contains 13 different message types that have been categorized as follows:

### 🏎️ **Core Race Data**
- **TimingData**: Driver positions, lap times, sector times, gaps, pit status, speed traps
- **DriverList**: Maps car numbers to grid line positions  
- **TopThree**: Leading drivers with time gaps
- **LapCount**: Current lap number in the session

### 🏁 **Track Conditions & Race Control**
- **TrackStatus**: Track conditions (Green, Yellow, Red flags, Safety Car, VSC)
- **RaceControlMessages**: Official race control communications and flag signals
- **WeatherData**: Air temperature, track temperature, humidity, pressure, wind, rainfall

### 📊 **Session Management**  
- **SessionData**: Session status (Started, Finished, etc.)
- **SessionInfo**: General session information
- **ExtrapolatedClock**: Race timing and clock synchronization

### 📈 **Performance Data**
- **TimingStats**: Best speed trap data and performance statistics
- **TimingAppData**: Additional timing application data

### 🔧 **System**
- **Heartbeat**: System keep-alive messages for connection monitoring

## Structured Race Data Organization

The enhanced `Livetiming.py` now organizes this data into a structured format:

### Driver Data (by car number)
```json
{
  "car_number": "1",
  "position": "1",
  "last_lap_time": {"Value": "1:22.111", "PersonalFastest": true},
  "best_lap_time": {"Value": "1:22.111", "Lap": 14},
  "gap_to_leader": "+1.234",
  "interval_to_ahead": {"Value": "+1.234"},
  "number_of_laps": 14,
  "in_pit": false,
  "sectors": {
    "0": {"value": "26.969", "segments": {...}},
    "1": {"value": "27.123", "segments": {...}},
    "2": {"value": "28.456", "segments": {...}}
  },
  "speeds": {"FL": {"Value": "309"}},
  "status": 8256
}
```

### Session Information
```json
{
  "current_lap": 15,
  "session_status": "Started",
  "session_info": {...}
}
```

### Track Conditions  
```json
{
  "status": "2",
  "status_name": "Yellow",
  "flags": [
    {
      "type": "GREEN", 
      "scope": "Track",
      "message": "GREEN LIGHT - PIT EXIT OPEN",
      "timestamp": "2025-09-07T13:03:35",
      "lap": 1
    }
  ],
  "weather": {
    "air_temp": "26.6",
    "track_temp": "43.7", 
    "humidity": "43.0",
    "pressure": "997.0",
    "wind_speed": "1.2",
    "wind_direction": "284",
    "rainfall": "0"
  }
}
```

### Race Control Messages
```json
[
  {
    "Utc": "2025-09-07T13:03:35",
    "Lap": 1,
    "Category": "Flag", 
    "Flag": "GREEN",
    "Scope": "Track",
    "Message": "GREEN LIGHT - PIT EXIT OPEN",
    "message_id": "20"
  }
]
```

## New API Endpoints

The enhanced system provides both structured and raw data access:

### Structured Data Endpoints
- `GET /race/data` - Complete structured race data
- `GET /race/drivers?car_number=1` - Driver data (all or specific car)
- `GET /race/session` - Session information  
- `GET /race/track` - Track status and weather
- `GET /race/messages?limit=10` - Race control messages

### Streaming Endpoints
- `GET /stream?format=structured` - Real-time structured race data
- `GET /stream?format=raw` - Original raw message format (backward compatible)

## Key Features

### 🎯 **Categorized Data Access**
Instead of chronological message history, data is organized by purpose:
- Driver performance and positioning
- Track conditions and safety
- Session management  
- Weather information
- Race control communications

### 🔄 **Real-time State Management**
- Maintains current race state for each driver
- Tracks latest weather conditions
- Preserves recent race control messages
- Updates session status in real-time

### 📊 **Rich Race Information** 
- Driver positions and gaps to leader
- Lap times with personal best indicators
- Sector times and speed trap data
- Pit stop status and tire strategies
- Flag conditions and safety periods

### 🔧 **Backward Compatibility**
- Original raw message streaming still available
- Existing APIs remain unchanged
- Raw history preserved for debugging

## Usage Examples

### Get Current Race Leader
```bash
curl "http://localhost:8000/race/drivers" | jq '.[] | select(.position == "1")'
```

### Monitor Track Status
```bash
curl "http://localhost:8000/race/track" | jq '.status_name, .flags[-1].message'
```

### Stream Live Race Data
```bash
curl "http://localhost:8000/stream?format=structured" 
```

This structured approach makes F1 race data much more accessible and useful for analysis, visualization, and real-time race monitoring applications.