//@ts-nocheck contains evaluted scripts for page
import { Browser, Page } from "./types.ts";

function sleep(seconds: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(" enough sleep~");
    }, seconds * 1000);
  });
}

async function getHomePageURL(page: Page) {
  const result: string = await page.evaluate(async () => {
    console.log("evaluate...");

    function sleep(second: number) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(" enough sleep~");
        }, second * 1000);
      });
    }

    let source: HTMLAnchorElement | null = null;
    let count = 1;
    while (source == null) {
      console.log(`#${count} querying source...`);
      source = document.querySelector("[href*=user]");
      await sleep(1);
      count++;
    }
    return (source as HTMLAnchorElement).href;
  });

  return result;
}

async function getVideoSource(page: Page) {
  const result: string = await page.evaluate(async () => {
    console.log("evaluate...");

    function sleep(second: number) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(" enough sleep~");
        }, second * 1000);
      });
    }

    let source: HTMLSourceElement | null = null;
    while (source == null) {
      source = document.querySelector("source");
      await sleep(1);
    }
    return source.src;
  });

  return result;
}

async function getVideoURLs(page: Page) {
  const urls: string[] = await page.evaluate(async () => {
    console.log("evaluate...");

    function sleep(second: number) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(" enough sleep~");
        }, second * 1000);
      });
    }

    let list: Array<string> = [];
    let count = 1;
    const max = 10;
    while (list.length === 0 && count < max) {
      console.log(`#${count} querying source...`);
      list = Array.from(
        document.querySelectorAll<HTMLAnchorElement>(
          'a[href*="www.douyin.com/video"]'
        )
      ).map((a) => a.href);
      await sleep(1);
      count++;
    }
    return list;
  });

  return urls;
}

async function gotoPage(
  browser: Browser,
  url: string,
  useAgent: string,
  timeoutSeconds = 10
) {
  const timeout = timeoutSeconds <= 0 ? 10 : timeoutSeconds;
  const page = await browser.newPage();
  await page.setUserAgent(useAgent);
  page.setDefaultNavigationTimeout(1000 * timeout);
  await page.goto(url);
  return page;
}

async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve(0);
        }
      }, 1000);
    });
  });
}

export {
  sleep,
  getHomePageURL,
  getVideoSource,
  getVideoURLs,
  gotoPage,
  autoScroll,
};
