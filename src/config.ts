import * as path from "https://deno.land/std@0.144.0/path/mod.ts";

export interface Config {
  network?: {
    userAgent?: string;
    navigationTimeout?: number;
  };
  downloader?: {
    dir?: string;
  };
}

const config: Config = {
  network: {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.9999.0 Safari/537.36",
    navigationTimeout: 120, // seconds
  },
  downloader: {
    dir: path.joinGlobs([Deno.env.get("HOME") as string, "douyin_downloads"]),
  },
};

export default config;
