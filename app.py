"""
Clock Variations App
A Python/Flask web app displaying multiple clock designs with timezone support.
Designs: digital, analog, loading bar, sundial, LED, planet, sun, moon.
"""

import os
from flask import Flask, render_template, jsonify
import pytz
from datetime import datetime

app = Flask(__name__)


@app.route("/")
def index():
    """Render the main clock app page."""
    timezones = sorted(pytz.all_timezones)
    return render_template("index.html", timezones=timezones)


@app.route("/api/time/<path:timezone>")
def get_time(timezone):
    """Return current time for a given timezone as JSON."""
    try:
        tz = pytz.timezone(timezone)
        now = datetime.now(tz)
        return jsonify({
            "timezone": timezone,
            "hour": now.hour,
            "minute": now.minute,
            "second": now.second,
            "year": now.year,
            "month": now.month,
            "day": now.day,
            "weekday": now.strftime("%A"),
            "formatted": now.strftime("%Y-%m-%d %H:%M:%S %Z"),
        })
    except pytz.exceptions.UnknownTimeZoneError:
        return jsonify({"error": f"Unknown timezone: {timezone}"}), 400


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug, port=5000)
