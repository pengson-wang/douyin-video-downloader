import puppeteer from "https://deno.land/x/puppeteer@14.1.1/mod.ts";
import { Browser, Page } from "./types.ts";

import { Downloader, Target } from "./downloader.ts";
import defaultConfig, { Config } from "./config.ts";
import {
  getHomePageURL,
  getVideoSource,
  getVideoURLs,
  gotoPage,
  autoScroll,
  sleep,
} from "./utils.ts";

export async function fromVideoPage(url: string, config?: Config) {
  //@ts-ignore oo
  const browser = (await puppeteer.launch({
    headless: true,
  })) as Browser;

  const userAgent =
    config?.network?.userAgent ?? (defaultConfig.network?.userAgent as string);
  const navigationTimeout =
    config?.network?.navigationTimeout ??
    defaultConfig.network?.navigationTimeout;
  const page = await gotoPage(browser, url, userAgent, navigationTimeout);

  const debugPage = async (page: Page) => {
    console.log(`#######################################`);
    console.log(`page is on ${page.url()}`);
    console.log(
      `innerWidth=${await page.waitForFunction("window.innerWidth")}`
    );
    console.log(
      `userAgent=${await page.waitForFunction("navigator.userAgent")}`
    );
    console.log(`#######################################`);
  };

  await debugPage(page);

  const isHomePage = (() => {
    return page.url().includes("user");
  })();

  let homePage;

  if (isHomePage) {
    console.log(`${page.url()} is HomePage, skip resolve homePage`);
    homePage = page;
  } else {
    console.log(`Try to resolving homePage`);
    const homePageURL = await getHomePageURL(page);
    await page.close();
    console.log(`Resolving home page at ${homePageURL}`);

    homePage = await gotoPage(browser, homePageURL, userAgent, 120);
    await debugPage(homePage);
  }

  await autoScroll(homePage);

  const videoURLs: string[] = await getVideoURLs(homePage);
  await homePage.close();

  console.log(videoURLs);
  console.log(`total ${videoURLs.length} videos`);

  const downloader = new Downloader(
    config?.downloader?.dir ?? (defaultConfig.downloader?.dir as string)
  );
  if (videoURLs.length) {
    await downloader.start();
  }

  let n = 0;
  const step = 5;
  while (videoURLs.slice(n * step, (n + 1) * step).length > 0) {
    const urls = videoURLs.slice(n * step, (n + 1) * step);

    await Promise.all(
      urls.map(async (url) => {
        const videoPage = await gotoPage(
          browser,
          url,
          userAgent,
          navigationTimeout
        );
        const pageURL = videoPage.url();
        const filename = `${pageURL.substring(
          pageURL.lastIndexOf("/"),
          pageURL.lastIndexOf("?") > pageURL.lastIndexOf("/")
            ? pageURL.lastIndexOf("?")
            : pageURL.length
        )}.mp4`;
        await debugPage(videoPage);
        const videoSource = await getVideoSource(videoPage);
        await videoPage.close();
        const target = { filename, url: videoSource } as Target;
        downloader.add(target);
      })
    );
    n++;
  }

  while (downloader.hasIncompletedJobs()) {
    await sleep(3);
  }
  downloader.stop();
  await browser.close();
}
