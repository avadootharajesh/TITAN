"use client";
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import axios from "axios";

import Link from "next/link";
import { useRouter } from "next/navigation";

const Titan = () => {
  const [url, setUrl] = React.useState("");
  const [sslScanResult, setSslScanResult] = React.useState(null);
  const [mhuntScanResult, setMhuntScanResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [eventSource, setEventSource] = React.useState(null);

  const router = useRouter();

  const stopFlag = React.useRef(false);

  async function stopCurrentProcess() {
    try {
      await axios.get("http://127.0.0.1:8000/stop_scan");
    } catch (error) {
      console.error(error);
    }
  }

  React.useEffect(() => {
    stopCurrentProcess();
    if (eventSource) eventSource.close();
  }, []);

  async function sslScan() {
    if (url) {
      try {
        setLoading(true);
        const response = await axios.post(
          "http://127.0.0.1:8000/sslscan",
          new URLSearchParams({ url })
        );
        // console.log(response.data);
        setSslScanResult(response.data.result);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setSslScanResult("An error occurred during SSL scan.");
        setLoading(false);
      }
    } else {
      alert("Please enter a URL");
    }
  }

  async function mhuntscan() {
    if (url) {
      try {
        setLoading(true);
        const es = new EventSource(
          `http://127.0.0.1:8000/mhunt?url=${encodeURIComponent(url)}`
        );
        es.onmessage = (event) => {
          setMhuntScanResult((prev) => {
            if (prev === null) return event.data;
            return prev + "\n" + event.data;
          });
        };
        es.onerror = (event) => {
          es.close();
          setEventSource(null);
          if (!stopFlag.current) {
            console.error(event);
            setMhuntScanResult("An error occurred. Please try again.");
          }
          setLoading(false);
          stopFlag.current = false;
        };
        setEventSource(es);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setMhuntScanResult("An error occurred. Please try again.");
        setLoading(false);
      }
    } else {
      alert("Please enter a URL");
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        "w-full items-center justify-center bg-slate-300 p-4 py-2"
      )}
    >
      <Card
        className={cn(
          "dark:bg-inherit bg-slate-200",
          "md:w-fit sm:w-1/3 xsm:w-1/3 xs:w-1/3 explore-component",
          "flex flex-col gap-4 max-h-9/12 h-fit shadow"
        )}
      >
        <CardHeader>
          <CardTitle>SSL Scan Tool</CardTitle>
          <CardDescription>
            Enter a URL to scan its SSL certificate.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            type="url"
            placeholder="https://..."
            onChange={(e) => setUrl(e.target.value)}
          />
          <span className="flex md:flex-row flex-col gap-2">
            <Button
              type="submit"
              onClick={sslScan}
              className={cn(
                "w-full md:w-auto bg-slate-300 text-black dark:bg-slate-950 dark:text-slate-300",
                "hover:text-slate-200"
              )}
              disabled={!url || loading}
            >
              {loading ? "Scanning..." : "Scan"}
            </Button>
            <Button
              type="submit"
              onClick={mhuntscan}
              className={cn(
                "w-full md:w-auto bg-slate-300 text-black dark:bg-slate-950 dark:text-slate-300",
                "hover:text-slate-200"
              )}
              disabled={!url || loading}
            >
              {loading ? "Listing..." : "Dir"}
            </Button>
            <Button
              type="submit"
              onClick={async () => {
                stopFlag.current = true;
                await stopCurrentProcess();
                if (eventSource) {
                  eventSource.close();
                  setEventSource(null);
                }
                setUrl("");
                setSslScanResult(null);
                setMhuntScanResult(null);
                setLoading(false);
              }}
              className={cn(
                "w-full md:w-auto bg-slate-300 text-black dark:bg-slate-950 dark:text-slate-300",
                "hover:text-slate-200"
              )}
              disabled={!url || loading}
            >
              Stop
            </Button>
            <Button
              onClick={() => {
                setUrl("");
                setSslScanResult(null);
                setMhuntScanResult(null);
                stopCurrentProcess().then(() => {
                  if (eventSource) {
                    eventSource.close();
                    setEventSource(null);
                  }
                });
              }}
              className={cn(
                "w-full md:w-auto bg-slate-300 text-slate-900 dark:bg-slate-950 dark:text-slate-300",
                "hover:text-slate-400"
              )}
            >
              Clear
            </Button>
          </span>
        </CardContent>
      </Card>

      {/* More Tools Section */}
      <Card
        className={cn(
          "dark:bg-inherit bg-slate-200",
          "md:w-fit sm:w-1/3 xsm:w-1/3 xs:w-1/3 explore-component",
          "flex flex-col gap-4 max-h-9/12 h-fit shadow"
        )}
      >
        <CardHeader className={cn("flex flex-row items-center justify-center")}>
          <CardTitle className={""}>More Tools</CardTitle>
          {/* <CardDescription>
            Additional security and scanning tools.
          </CardDescription> */}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            className={cn(
              "w-full md:w-auto bg-slate-300 text-black dark:bg-slate-950 dark:text-slate-300",
              "hover:text-slate-200"
            )}
            onClick={() => {
              router.push("/more-tools");
            }}
          >
            Coming Soon
          </Button>
        </CardContent>
      </Card>

      {/* SSL Scan Result */}
      {sslScanResult && (
        <div className="w-[800px] border-2 border-blue-400 rounded-lg p-3 bg-white text-black">
          <h3 className="font-bold text-lg mb-2">SSL Scan Result:</h3>
          <div
            className="whitespace-pre-wrap font-mono text-sm"
            dangerouslySetInnerHTML={{ __html: sslScanResult }}
          />
        </div>
      )}

      {/* MHunt Result */}
      {mhuntScanResult && (
        <div className="w-[800px] border-2 border-green-400 rounded-lg p-3 bg-white text-black">
          <h3 className="font-bold text-lg mb-2">Directory Listing Result:</h3>
          <div className="whitespace-pre-wrap font-mono text-sm">
            {mhuntScanResult}
          </div>
        </div>
      )}
    </div>
  );
};

export default Titan;
