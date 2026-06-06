# to run : uvicorn app:app --reload
import sys

from fastapi import FastAPI, Request, Form, HTTPException, Query
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import asyncio

import httpx
from urllib.parse import urlparse
# util
async def is_url_valid_and_reachable(url: str) -> bool:
    try:
        url = url.strip()

        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        parsed = urlparse(url)
        if not parsed.netloc:
            return False

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
        }

        async with httpx.AsyncClient(
            timeout=10,
            follow_redirects=True,
            headers=headers,
        ) as client:

            # Try GET only (more reliable than HEAD)
            try:
                response = await client.get(url)
                if response.status_code < 500:
                    return True
            except Exception as e:
                print(f"GET failed: {e}")

            # Optional second attempt (lightweight fallback)
            try:
                response = await client.get(url, timeout=5)
                return response.status_code < 500
            except Exception as e:
                print(f"Retry failed: {e}")

        return False

    except Exception as e:
        print(f"URL validation failed: {e}")
        return False

import subprocess
import os
import signal

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows only the specified origins to make requests
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)
current_process = None


@app.post("/sslscan")
async def sslscan(url: str = Form(...)):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    print(f"Incoming URL: {url}")

    is_valid = await is_url_valid_and_reachable(url)

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or unreachable URL")

    parsed = urlparse(url)
    hostname = parsed.netloc or parsed.path
    target = f"{hostname}:443"

    print(f"SSLYZE TARGET: {target}")

    try:
        result = subprocess.run(
            ["sslyze", target],
            capture_output=True,
            text=True,
            timeout=300
        )

        print("RETURN CODE:", result.returncode)

        # ❗ DO NOT treat returncode as failure for SSLyze

        output = result.stdout.strip()

        if not output:
            raise HTTPException(
                status_code=500,
                detail=f"No SSLyze output. stderr={result.stderr}"
            )

        return JSONResponse({
            "target": target,
            "status": "completed",
            "returncode": result.returncode,
            "result": output,
            "warnings": result.stderr.strip() if result.stderr else None
        })

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="SSL scan timed out")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def format_output(output: str) -> str:
    return output.replace("\n", "<br>").replace("\r", "")



@app.get("/mhunt")
async def mhunt_scan(url: str = Query(..., description="URL to scan")):
    global current_process

    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    print(f"URL received: {url}")

    wordlist_path = "./resources/fuzz2.txt"

    # 40-50 threads is usually faster and more stable than 88
    threads = 50

    command = [
        "./resources/feroxbuster.exe",
        "-u", url,
        "-w", wordlist_path,
        "-s", "200,301,302,403",
        "-n",
        "-t", str(threads),
        "--silent"
    ]

    if not os.path.isfile(command[0]):
        raise HTTPException(
            status_code=500,
            detail="feroxbuster executable not found"
        )

    async def generate():
        global current_process

        try:
            print("Running:", " ".join(command))

            current_process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,  # IMPORTANT FIX
                text=True,
                bufsize=1,
                universal_newlines=True
            )

            while True:

                # Process ended?
                if current_process.poll() is not None:

                    # flush remaining output
                    while True:
                        line = await asyncio.to_thread(
                            current_process.stdout.readline
                        )

                        if not line:
                            break

                        yield f"data: {line.strip()}\n\n"

                    break

                line = await asyncio.to_thread(
                    current_process.stdout.readline
                )

                if line:
                    line = line.strip()

                    if line:
                        print(line)
                        yield f"data: {line}\n\n"

                await asyncio.sleep(0.01)

            yield "data: SCAN_COMPLETED\n\n"

        except Exception as e:
            print("ERROR:", str(e))
            yield f"data: ERROR: {str(e)}\n\n"

        finally:
            current_process = None

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.post("/start-scan")
async def start_scan(url: str = Form(...)):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    # Redirect to mhunt_scan endpoint
    return {"message": "Redirecting to mhunt scan...", "url": f"/mhunt?url={url}"}

@app.get("/stop_scan")
async def stop_scan():
    global current_process
    if current_process:
        try:
            current_process.terminate()
            current_process = None
            print("process terminated")
            return {"status": "success"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return {"status": "no process running"}



@app.get("/subdomain-listing")
async def subdomain_listing(url: str = Query(...)):

    import traceback

    if not url:
        async def gen():
            yield "data: URL is required\n\n"
        return StreamingResponse(gen(), media_type="text/event-stream")

    is_valid = await is_url_valid_and_reachable(url)
    print(f"URL validation result for {url}: {is_valid}")
    if not is_valid:
        async def gen():
            yield "data: Invalid URL\n\n"
        return StreamingResponse(gen(), media_type="text/event-stream")

    command_file = os.path.join("resources", "command_text.txt")

    try:
        with open(command_file, "r") as f:
            command_template = f.readline().strip()

        import shlex
        command = shlex.split(command_template)

        BASE_DIR = os.path.dirname(os.path.abspath(__file__))

        ffuf_path = os.path.join(BASE_DIR, "resources", "ffuf.exe")

        if not os.path.exists(ffuf_path):
            raise Exception(f"ffuf not found at {ffuf_path}")

        command[0] = ffuf_path

        # fix paths
        for i, arg in enumerate(command):
            if arg == "-w" and i + 1 < len(command):
                command[i + 1] = os.path.join(BASE_DIR, "resources", command[i + 1])

        print("FINAL COMMAND:", command)


        async def generate():
            global current_process

            import traceback

            try:
                process = subprocess.Popen(
                    command,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,  # 🔥 CRITICAL FIX
                    text=True,
                    bufsize=1
                )

                current_process = process

                print("FFUF STARTED PID:", process.pid)

                while True:
                    line = await asyncio.to_thread(process.stdout.readline)

                    # 🔥 important fix: do NOT break on empty line immediately
                    if not line:
                        if process.poll() is not None:
                            break
                        continue
                    
                    line = line.strip()

                    if line:
                        print("OUT:", line)
                        yield f"data: {line}\n\n"

                rc = process.wait()
                print("FFUF EXIT CODE:", rc)

                current_process = None

            except Exception as e:
                print(traceback.format_exc())
                yield f"data: Exception: {str(e)}\n\n"


        return StreamingResponse(generate(), media_type="text/event-stream")

    except Exception as e:
        print("OUTER ERROR:", str(e))
        return JSONResponse({"error": str(e)})

@app.get("/url-checker")
async def url_checker(url: str = Query(..., alias="url", description="URL to check")):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    # check if the url is valid and reachable
    is_valid = await is_url_valid_and_reachable(url)
    if not is_valid:
        return {"status": "error", "message": "Invalid URL"}
    return {"status": "success", "message": "Url is valid and reachable!🎉✅"}


# Start the FastAPI server with Uvicorn (this is how FastAPI applications are typically served)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
