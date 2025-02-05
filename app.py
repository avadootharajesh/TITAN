from flask import Flask, request, jsonify, render_template, Response, redirect, url_for
import subprocess
import os
import signal

app = Flask(__name__)
current_process = None


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/sslscan", methods=["POST"])
def scan():
    url = request.form.get("url")
    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        # Run the sslyze command
        result = subprocess.run(
            ["sslyze", "--certinfo", url], capture_output=True, text=True
        )

        # Capture the standard output
        output = result.stdout
        if result.returncode != 0:
            return jsonify({"error": "SSL scan failed", "details": result.stderr}), 500

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

    # Format the output into a cleaner, structured format
    formatted_output = format_output(output)
    # print(formatted_output)
    return jsonify({"result": formatted_output})

def format_output(output):
    formatted = output.replace("\n", "<br>").replace("\r", "")
    return formatted

@app.route("/mhunt", methods=["POST"])
def mhunt_scan():
    # Get the URL from the POST data
    url = request.form.get("url")
    if not url:
        return jsonify({"error": "URL is required"}), 400

    wordlist_path = "./resources/fuzz2.txt"
    threads = 88

    # Command to run feroxbuster
    command = [
        "./resources/feroxbuster",
        "-u", url,
        "-w", wordlist_path,
        "-s", "200",
        "-n", "-t", str(threads),
        "--silent"
    ]

    # Start the process and return the URL for streaming the output
    def generate():
        try:
            current_process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )

            # Stream output as it comes
            for line in iter(current_process.stdout.readline, ""):
                yield f"data: {line.strip()}\n\n"  # Send each line as an event
            current_process.stdout.close()

            # Wait for process to finish and handle any error
            return_code = current_process.wait()
            if return_code != 0:
                error_output = current_process.stderr.read()
                yield f"data: Error: {error_output.strip()}\n\n"
        except Exception as e:
            yield f"data: Exception occurred: {str(e)}\n\n"

    # Return SSE response
    return Response(generate(), mimetype="text/event-stream")


# The POST endpoint to trigger the scan and then redirect to the SSE stream
@app.route("/start-scan", methods=["POST"])
def start_scan():
    url = request.form.get("url")
    if not url:
        return jsonify({"error": "URL is required"}), 400

    # Redirect to SSE stream endpoint
    return redirect(url_for('mhunt_scan'))

@app.route("/stop_scan")
def stop_scan():
    global current_process
    if current_process:
        try:
            current_process.terminate()
            current_process = None
            return jsonify({"status": "success"})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({"status": "no process running"})


if __name__ == "__main__":
    app.run(debug=True)
