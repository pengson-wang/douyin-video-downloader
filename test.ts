import puppeteer from "https://deno.land/x/puppeteer@14.1.1/mod.ts";
import * as path from "https://deno.land/std@0.144.0/path/mod.ts";
import home_dir from "https://deno.land/x/dir/home_dir/mod.ts";
import { Downloader } from './src/downloader.ts'
import Resolver from './src/page-resolver.ts'
import lodash from "https://esm.sh/lodash@4.17.21"
import defaultConfig, { Config } from './src/config.ts'

function sleep(seconds: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(" enough sleep~");
    }, seconds * 1000);
  });
}

function urlToFilename(url: string) {
  return path.basename(url) + '.mp4'
}


async function downloadAll(url: string, config: Config) {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const resolver = new Resolver(browser, config)
  const videoPageURLs = await resolver.resolveVideoPageFromAny(url)
  console.log(videoPageURLs)
  const targets = await Promise.all(videoPageURLs.map(async pageURL => {
    const videoURL = await resolver.resolveVideoResource(pageURL)
    const filename = urlToFilename(pageURL);
    return {filename: filename, url: videoURL!}
  }))
  await resolver.destory()

  const downloader = new Downloader(config.downloader.dir, config.downloader.max, true)
  downloader.add(...targets)

  while(downloader.hasIncompletedJobs()) {
    await sleep(5)
  }

  await downloader.stop()

  window.addEventListener("unload", (e) => {
    (async () => {
      console.log(`got ${e.type} event in onunload function (index)`);
      try {
        await resolver.destory()
      } catch(err) {
        console.error(err)
      }

    })()
  });
}

async function download(url: string, config: Config) {

  const browser = await puppeteer.launch({
    headless: true,
  });
  const resolver = new Resolver(browser, config)
  const videoURL = await resolver.resolveVideoResource(url)
  const target = {filename: urlToFilename(url), url: videoURL! }
  await resolver.destory()

  const downloader = new Downloader(config.downloader.dir, config.downloader.max, true)
  downloader.add(target)

  while(downloader.hasIncompletedJobs()) {
    await sleep(5)
  }

  await downloader.stop()

  window.addEventListener("unload", (e) => {
    (async () => {
      console.log(`got ${e.type} event in onunload function (index)`);
      try {
        await resolver.destory()
      } catch(err) {
        console.error(err)
      }

    })()
  });
}

(async () => {
  const config = lodash.merge(defaultConfig, {network: {
      navigationTimeout: 2 * 60 * 1000, // 2 min
    },
    downloader: {
      dir: path.joinGlobs([home_dir() || ".", "douyin-x"]),
      max: 5,
    },})
  await download("https://v.douyin.com/2tcFUht/", config)
})();
