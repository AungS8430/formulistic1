#!/usr/bin/env python3
"""
Test script for the enhanced F1 race data functionality.
Tests the new structured data parsing and organization.
"""

import sys
import os
import ast
import json
from util.Livetiming import RaceData, add_to_history, get_race_data

def test_race_data_parsing():
    """Test parsing of various F1 message types."""
    
    # Sample messages from the saved_data.txt
    test_messages = [
        # Weather data
        ['WeatherData', {'AirTemp': '26.6', 'Humidity': '43.0', 'Pressure': '997.0', 'Rainfall': '0', 'TrackTemp': '43.7', 'WindDirection': '284', 'WindSpeed': '1.2', '_kf': True}, '2025-09-07T12:58:03.407Z'],
        
        # Timing data with position and gaps
        ['TimingData', {'Lines': {'4': {'GapToLeader': '+0.160', 'IntervalToPositionAhead': {'Value': '+0.160'}}}}, '2025-09-07T13:03:38.321Z'],
        
        # Race control message
        ['RaceControlMessages', {'Messages': {'20': {'Utc': '2025-09-07T13:03:35', 'Lap': 1, 'Category': 'Flag', 'Flag': 'GREEN', 'Scope': 'Track', 'Message': 'GREEN LIGHT - PIT EXIT OPEN'}}}, '2025-09-07T13:03:34.961Z'],
        
        # Track status
        ['TrackStatus', {'Status': '2', 'Message': 'Yellow', '_kf': True}, '2025-09-07T13:59:17.924Z'],
        
        # Lap count
        ['LapCount', {'CurrentLap': 2}, '2025-09-07T13:05:02.158Z'],
        
        # Rich timing data with lap time and sectors
        ['TimingData', {'Lines': {'87': {'NumberOfLaps': 53, 'Sectors': {'2': {'Value': '26.969', 'PersonalFastest': True}}, 'Speeds': {'FL': {'Value': '309'}}, 'BestLapTime': {'Value': '1:21.820', 'Lap': 53}, 'LastLapTime': {'Value': '1:21.820', 'PersonalFastest': True}}}}, '2025-09-07T14:18:08.866Z'],
        
        # Driver list
        ['DriverList', {'81': {'Line': 4}, '16': {'Line': 3}}, '2025-09-07T13:04:04.932Z'],
        
        # Session data
        ['SessionData', {'StatusSeries': {'4': {'Utc': '2025-09-07T13:03:34.805Z', 'SessionStatus': 'Started'}}}, '2025-09-07T13:03:34.805Z']
    ]
    
    print("Testing F1 Race Data Parsing...")
    print("=" * 50)
    
    # Process test messages
    for i, msg in enumerate(test_messages, 1):
        print(f"\n{i}. Processing {msg[0]} message...")
        add_to_history(msg)
    
    # Get structured race data
    race_data = get_race_data()
    
    print(f"\n✓ Processed {len(test_messages)} messages")
    print(f"✓ Tracking {len(race_data['drivers'])} drivers")
    
    # Display structured results
    print("\n" + "=" * 50)
    print("STRUCTURED RACE DATA RESULTS")
    print("=" * 50)
    
    # Session info
    print(f"\n📊 SESSION INFO:")
    print(f"   Current Lap: {race_data['session']['current_lap']}")
    print(f"   Status: {race_data['session']['session_status']}")
    
    # Track conditions
    print(f"\n🏁 TRACK CONDITIONS:")
    print(f"   Status: {race_data['track'].get('status_name', 'Unknown')}")
    weather = race_data['track']['weather']
    print(f"   Air Temp: {weather.get('air_temp', 'N/A')}°C")
    print(f"   Track Temp: {weather.get('track_temp', 'N/A')}°C")
    print(f"   Humidity: {weather.get('humidity', 'N/A')}%")
    print(f"   Wind: {weather.get('wind_speed', 'N/A')} m/s @ {weather.get('wind_direction', 'N/A')}°")
    
    # Race control messages
    print(f"\n📻 RACE CONTROL ({len(race_data['race_control_messages'])} messages):")
    for msg in race_data['race_control_messages']:
        flag = msg.get('Flag', 'N/A')
        message = msg.get('Message', 'No message')
        lap = msg.get('Lap', 'N/A')
        print(f"   Lap {lap}: {flag} - {message}")
    
    # Driver data
    print(f"\n🏎️  DRIVER DATA ({len(race_data['drivers'])} drivers):")
    for car_num, driver in sorted(race_data['drivers'].items(), key=lambda x: int(x[0])):
        print(f"\n   Car #{car_num}:")
        if driver['position']:
            print(f"     Position: P{driver['position']}")
        if driver['gap_to_leader']:
            print(f"     Gap to Leader: {driver['gap_to_leader']}")
        if driver['last_lap_time']:
            lap_time = driver['last_lap_time']
            time_val = lap_time.get('Value', 'N/A') if isinstance(lap_time, dict) else lap_time
            fastest = " (Personal Best!)" if isinstance(lap_time, dict) and lap_time.get('PersonalFastest') else ""
            print(f"     Last Lap: {time_val}{fastest}")
        if driver['best_lap_time']:
            best_time = driver['best_lap_time']
            time_val = best_time.get('Value', 'N/A') if isinstance(best_time, dict) else best_time
            lap_num = best_time.get('Lap', '') if isinstance(best_time, dict) else ''
            print(f"     Best Lap: {time_val} (Lap {lap_num})")
        if driver['number_of_laps']:
            print(f"     Laps Completed: {driver['number_of_laps']}")
        if driver['in_pit']:
            print(f"     Status: IN PIT")
        
        # Sector times
        sectors_shown = False
        for sector_num, sector_data in driver['sectors'].items():
            if sector_data['value']:
                if not sectors_shown:
                    print(f"     Sectors:", end="")
                    sectors_shown = True
                personal_best = " (PB)" if isinstance(sector_data, dict) and sector_data.get('PersonalFastest') else ""
                print(f" S{int(sector_num)+1}:{sector_data['value']}{personal_best}", end="")
        if sectors_shown:
            print()  # New line after sectors
        
        # Speed traps
        if driver['speeds']:
            speeds = []
            for trap, speed_data in driver['speeds'].items():
                speed_val = speed_data.get('Value', speed_data) if isinstance(speed_data, dict) else speed_data
                speeds.append(f"{trap}:{speed_val}km/h")
            if speeds:
                print(f"     Speeds: {' '.join(speeds)}")

def test_with_real_data():
    """Test with actual data from saved_data.txt (first 100 lines)."""
    print("\n" + "=" * 60)
    print("TESTING WITH REAL DATA (first 100 messages)")
    print("=" * 60)
    
    data_file = "saved_data.txt"
    if not os.path.exists(data_file):
        print(f"⚠️  {data_file} not found. Skipping real data test.")
        return
    
    # Clear any existing data
    from util.Livetiming import race_data
    race_data.__init__()
    
    processed_count = 0
    unique_types = set()
    
    with open(data_file, 'r') as f:
        for i, line in enumerate(f):
            if i >= 100:  # Limit to first 100 lines for testing
                break
            try:
                msg = ast.literal_eval(line.strip())
                add_to_history(msg)
                if isinstance(msg, list) and len(msg) > 0:
                    unique_types.add(msg[0])
                processed_count += 1
            except:
                continue
    
    race_data_dict = get_race_data()
    
    print(f"\n✓ Processed {processed_count} real messages")
    print(f"✓ Found {len(unique_types)} message types: {', '.join(sorted(unique_types))}")
    print(f"✓ Tracking {len(race_data_dict['drivers'])} drivers")
    print(f"✓ {len(race_data_dict['race_control_messages'])} race control messages")
    
    # Show summary of drivers with data
    drivers_with_position = sum(1 for d in race_data_dict['drivers'].values() if d.get('position'))
    drivers_with_timing = sum(1 for d in race_data_dict['drivers'].values() if d.get('last_lap_time'))
    
    print(f"✓ {drivers_with_position} drivers with position data")
    print(f"✓ {drivers_with_timing} drivers with lap time data")
    
    if race_data_dict['session']['current_lap'] > 1:
        print(f"✓ Session at lap {race_data_dict['session']['current_lap']}")
    
    if race_data_dict['track']['weather']['air_temp']:
        print(f"✓ Weather data available (Air: {race_data_dict['track']['weather']['air_temp']}°C)")

if __name__ == "__main__":
    try:
        test_race_data_parsing()
        test_with_real_data()
        print(f"\n🎉 All tests completed successfully!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)