"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

import axios from "axios";

const MoreTools = () => {
  const [url, setUrl] = React.useState("");
  const [results, setResults] = React.useState({
    sample1: null,
    sample2: null,
    sample3: null,
    sample4: null,
    sample5: null,
    sample6: null,
    sample7: null,
    sample8: null,
    sample9: null,
    subdomain: null,
  });
  const [loading, setLoading] = React.useState(false);
  const [eventSource, setEventSource] = React.useState(null);

  const stopFlag = React.useRef(false);

  function clearResults() {
    setResults({
      sample1: null,
      sample2: null,
      sample3: null,
      sample4: null,
      sample5: null,
      sample6: null,
      sample7: null,
      sample8: null,
      sample9: null,
      subdomain: null,
    });
  }

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

  // Subdomain listing handler with streaming
  const handleSubdomainListing = () => {
    clearResults();
    if (url) {
      try {
        setLoading(true);
        const es = new EventSource(
          `http://127.0.0.1:8000/subdomain-listing?url=${encodeURIComponent(
            url
          )}`
        );
        es.onmessage = (event) => {
          setResults((prev) => ({
            ...prev,
            subdomain:
              prev.subdomain === null
                ? event.data
                : prev.subdomain + "\n" + event.data,
          }));
        };
        es.onerror = (event) => {
          es.close();
          setEventSource(null);
          if (!stopFlag.current) {
            console.error(event);
            setResults((prev) => ({
              ...prev,
              subdomain: "An error occurred. Please try again.",
            }));
          }
          setLoading(false);
          stopFlag.current = false;
        };
        setEventSource(es);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setResults((prev) => ({
          ...prev,
          subdomain: "An error occurred. Please try again.",
        }));
        setLoading(false);
      }
    } else {
      alert("Please enter a URL");
    }
  };

  // Sample button handlers
  const handleSample1 = () => {
    setLoading(true);
    clearResults();
    axios.get(`http://127.0.0.1:8000/url-checker?url=${encodeURIComponent(url)}`)
      .then((response) => {
        setResults((prev) => ({ ...prev, sample1: response.data.message }));
      })
      .catch((error) => {
        console.error(error);
        setResults((prev) => ({ ...prev, sample1: "An error occurred. Please try again." }));
      });
    setLoading(false);
  };

  const handleSample2 = () => {
    setResults((prev) => ({ ...prev, sample2: "Sample 2 result for: " + url }));
  };

  const handleSample3 = () => {
    setResults((prev) => ({ ...prev, sample3: "Sample 3 result for: " + url }));
  };

  const handleSample4 = () => {
    setResults((prev) => ({ ...prev, sample4: "Sample 4 result for: " + url }));
  };

  const handleSample5 = () => {
    setResults((prev) => ({ ...prev, sample5: "Sample 5 result for: " + url }));
  };

  const handleSample6 = () => {
    setResults((prev) => ({ ...prev, sample6: "Sample 6 result for: " + url }));
  };

  const handleSample7 = () => {
    setResults((prev) => ({ ...prev, sample7: "Sample 7 result for: " + url }));
  };

  const handleSample8 = () => {
    setResults((prev) => ({ ...prev, sample8: "Sample 8 result for: " + url }));
  };

  const handleSample9 = () => {
    setResults((prev) => ({ ...prev, sample9: "Sample 9 result for: " + url }));
  };

  // Reusable download function
  const handleDownload = (content, filename) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
          <CardTitle>More Tools</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            type="url"
            placeholder="google.com (no https:// http:// www. etc)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            {/* First row of 3 buttons */}
            <div className="flex md:flex-row flex-col gap-2">
              <Button
                onClick={handleSample1}
                className="w-full md:w-auto bg-slate-300 text-black dark:bg-slate-950 dark:text-slate-300 hover:text-slate-200"
              >
                Url Checker
              </Button>
              <Button
                onClick={handleSample2}
                className="w-full md:w-auto bg-slate-300 text-black dark:bg-slate-950 dark:text-slate-300 hover:text-slate-200"
              >
                Sample 2
              </Button>
              <Button
                onClick={handleSample3}
                className="w-full md:w-auto bg-slate-300 text-black dark:bg-slate-950 dark:text-slate-300 hover:text-slate-200"
              >
                Sample 3
              </Button>
            </div>
            {/* Second row of 3 buttons */}
            <div className="flex md:flex-row flex-col gap-2">
              <Button
                onClick={handleSample4}
                className="w-full md:w-auto bg-slate-300 text-black dark:bg-slate-950 dark:text-slate-300 hover:text-slate-200"
              >
                Sample 4
              </Button>
              <Button
                onClick={handleSample5}
                className="w-full md:w-auto bg-slate-300 text-black dark:bg-slate-950 dark:text-slate-300 hover:text-slate-300"
              >
                Sample 5
              </Button>
              <Button
                onClick={handleSample6}
                className="w-full md:w-auto bg-slate-300 text-black dark:bg-slate-950 dark:text-slate-300 hover:text-slate-200"
              >
                Sample 6
              </Button>
            </div>
            {/* Third row of 3 buttons */}
            <div className="flex md:flex-row flex-col gap-2">
              <Button
                onClick={handleSample7}
                className="w-full md:w-auto bg-slate-300 text-black dark:bg-slate-950 dark:text-slate-300 hover:text-slate-200"
              >
                Sample 7
              </Button>
              <Button
                onClick={handleSample8}
                className="w-full md:w-auto bg-slate-300 text-black dark:bg-slate-950 dark:text-slate-300 hover:text-slate-200"
              >
                Sample 8
              </Button>
              <Button
                onClick={handleSample9}
                className="w-full md:w-auto bg-slate-300 text-black dark:bg-slate-950 dark:text-slate-300 hover:text-slate-200"
              >
                Sample 9
              </Button>
            </div>
            {/* Subdomain Listing Button */}
            <div className="flex md:flex-row flex-col gap-2">
              <Button
                className="w-full md:w-auto bg-slate-300 text-black dark:bg-slate-950 dark:text-slate-300 hover:text-slate-200"
                onClick={handleSubdomainListing}
                disabled={!url || loading}
              >
                {loading ? "Scanning..." : "Subdomain Listing"}
              </Button>
              <Button
                onClick={async () => {
                  stopFlag.current = true;
                  await stopCurrentProcess();
                  if (eventSource) {
                    eventSource.close();
                    setEventSource(null);
                  }
                  setUrl("");
                  clearResults();
                  setLoading(false);
                }}
                className="w-full md:w-auto bg-slate-300 text-black dark:bg-slate-950 dark:text-slate-300 hover:text-slate-200"
                disabled={!url || loading}
              >
                Stop
              </Button>
              <Button
                onClick={() => {
                  setUrl("");
                  setLoading(false);
                  clearResults();
                  stopCurrentProcess().then(() => {
                    if (eventSource) {
                      eventSource.close();
                      setEventSource(null);
                    }
                  });
                  // reload the page
                  window.location.reload();
                }}
                className="w-full md:w-auto bg-slate-300 text-slate-900 dark:bg-slate-950 dark:text-slate-300 hover:text-slate-400"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample 1 Result */}
      {results.sample1 && (
        <div className="w-[800px] border-2 border-blue-400 rounded-lg p-3 bg-white text-black relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Url Checker Result:</h3>
            <Button
              onClick={() =>
                handleDownload(results.sample1, "sample1_result.txt")
              }
              className={cn(
                "bg-black text-white hover:bg-gray-300 hover:text-black px-3 py-1 text-sm",
                "dark:bg-white dark:text-white",
                "transition-colors duration-300"
              )}
            >
              <Download size={16} />
            </Button>
          </div>
          <div className="whitespace-pre-wrap font-mono text-sm">
            {results.sample1}
          </div>
        </div>
      )}

      {/* Sample 2 Result */}
      {results.sample2 && (
        <div className="w-[800px] border-2 border-blue-400 rounded-lg p-3 bg-white text-black relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Sample 2 Result:</h3>
            <Button
              onClick={() =>
                handleDownload(results.sample2, "sample2_result.txt")
              }
              className={cn(
                "bg-black text-white hover:bg-gray-300 hover:text-black px-3 py-1 text-sm",
                "dark:bg-white dark:text-white",
                "transition-colors duration-300"
              )}
            >
              <Download size={16} />
            </Button>
          </div>
          <div className="whitespace-pre-wrap font-mono text-sm">
            {results.sample2}
          </div>
        </div>
      )}

      {/* Sample 3 Result */}
      {results.sample3 && (
        <div className="w-[800px] border-2 border-blue-400 rounded-lg p-3 bg-white text-black relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Sample 3 Result:</h3>
            <Button
              onClick={() =>
                handleDownload(results.sample3, "sample3_result.txt")
              }
              className={cn(
                "bg-black text-white hover:bg-gray-300 hover:text-black px-3 py-1 text-sm",
                "dark:bg-white dark:text-white",
                "transition-colors duration-300"
              )}
            >
              <Download size={16} />
            </Button>
          </div>
          <div className="whitespace-pre-wrap font-mono text-sm">
            {results.sample3}
          </div>
        </div>
      )}

      {/* Sample 4 Result */}
      {results.sample4 && (
        <div className="w-[800px] border-2 border-blue-400 rounded-lg p-3 bg-white text-black relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Sample 4 Result:</h3>
            <Button
              onClick={() =>
                handleDownload(results.sample4, "sample4_result.txt")
              }
              className={cn(
                "bg-black text-white hover:bg-gray-300 hover:text-black px-3 py-1 text-sm",
                "dark:bg-white dark:text-white",
                "transition-colors duration-300"
              )}
            >
              <Download size={16} />
            </Button>
          </div>
          <div className="whitespace-pre-wrap font-mono text-sm">
            {results.sample4}
          </div>
        </div>
      )}

      {/* Sample 5 Result */}
      {results.sample5 && (
        <div className="w-[800px] border-2 border-blue-400 rounded-lg p-3 bg-white text-black relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Sample 5 Result:</h3>
            <Button
              onClick={() =>
                handleDownload(results.sample5, "sample5_result.txt")
              }
              className={cn(
                "bg-black text-white hover:bg-gray-300 hover:text-black px-3 py-1 text-sm",
                "dark:bg-white dark:text-white",
                "transition-colors duration-300"
              )}
            >
              <Download size={16} />
            </Button>
          </div>
          <div className="whitespace-pre-wrap font-mono text-sm">
            {results.sample5}
          </div>
        </div>
      )}

      {/* Sample 6 Result */}
      {results.sample6 && (
        <div className="w-[800px] border-2 border-blue-400 rounded-lg p-3 bg-white text-black relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Sample 6 Result:</h3>
            <Button
              onClick={() =>
                handleDownload(results.sample6, "sample6_result.txt")
              }
              className={cn(
                "bg-black text-white hover:bg-gray-300 hover:text-black px-3 py-1 text-sm",
                "dark:bg-white dark:text-white",
                "transition-colors duration-300"
              )}
            >
              <Download size={16} />
            </Button>
          </div>
          <div className="whitespace-pre-wrap font-mono text-sm">
            {results.sample6}
          </div>
        </div>
      )}

      {/* Sample 7 Result */}
      {results.sample7 && (
        <div className="w-[800px] border-2 border-blue-400 rounded-lg p-3 bg-white text-black relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Sample 7 Result:</h3>
            <Button
              onClick={() =>
                handleDownload(results.sample7, "sample7_result.txt")
              }
              className={cn(
                "bg-black text-white hover:bg-gray-300 hover:text-black px-3 py-1 text-sm",
                "dark:bg-white dark:text-white",
                "transition-colors duration-300"
              )}
            >
              <Download size={16} />
            </Button>
          </div>
          <div className="whitespace-pre-wrap font-mono text-sm">
            {results.sample7}
          </div>
        </div>
      )}

      {/* Sample 8 Result */}
      {results.sample8 && (
        <div className="w-[800px] border-2 border-blue-400 rounded-lg p-3 bg-white text-black relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Sample 8 Result:</h3>
            <Button
              onClick={() =>
                handleDownload(results.sample8, "sample8_result.txt")
              }
              className={cn(
                "bg-black text-white hover:bg-gray-300 hover:text-black px-3 py-1 text-sm",
                "dark:bg-white dark:text-white",
                "transition-colors duration-300"
              )}
            >
              <Download size={16} />
            </Button>
          </div>
          <div className="whitespace-pre-wrap font-mono text-sm">
            {results.sample8}
          </div>
        </div>
      )}

      {/* Sample 9 Result */}
      {results.sample9 && (
        <div className="w-[800px] border-2 border-blue-400 rounded-lg p-3 bg-white text-black relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Sample 9 Result:</h3>
            <Button
              onClick={() =>
                handleDownload(results.sample9, "sample9_result.txt")
              }
              className={cn(
                "bg-black text-white hover:bg-gray-300 hover:text-black px-3 py-1 text-sm",
                "dark:bg-white dark:text-white",
                "transition-colors duration-300"
              )}
            >
              <Download size={16} />
            </Button>
          </div>
          <div className="whitespace-pre-wrap font-mono text-sm">
            {results.sample9}
          </div>
        </div>
      )}

      {/* Subdomain Listing Result */}
      {results.subdomain && (
        <div className="w-[800px] border-2 border-green-400 rounded-lg p-3 bg-white text-black relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Subdomain Listing Result:</h3>
            <Button
              onClick={() =>
                handleDownload(results.subdomain, "subdomain_result.txt")
              }
              className={cn(
                "bg-black text-white hover:bg-gray-300 hover:text-black px-3 py-1 text-sm",
                "dark:bg-white dark:text-white",
                "transition-colors duration-300"
              )}
            >
              <Download size={16} />
            </Button>
          </div>
          <div className="whitespace-pre-wrap font-mono text-sm">
            {results.subdomain}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoreTools;
