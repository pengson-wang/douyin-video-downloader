import * as path from "https://deno.land/std@0.144.0/path/mod.ts";
import { fromVideoPage } from "./index.ts";

(async () => {
  await fromVideoPage("https://v.douyin.com/YaDuaXq/", {
    network: {
      navigationTimeout: 60 * 50,
    },
    downloader: {
      dir: path.joinGlobs([
        Deno.env.get("HOME") as string,
        "douyin_wang_da_peng",
      ]),
    },
  });
})();
