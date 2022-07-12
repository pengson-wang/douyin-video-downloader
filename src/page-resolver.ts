import { Browser, Page } from "https://deno.land/x/puppeteer@14.1.1/mod.ts";
import  { Config } from "./config.ts";
import {
    getHomePageURL,
    getVideoSource,
    getVideoURLs,
    autoScroll,
} from "./utils.ts";

type MaybePage = Page | null | undefined

export default class Resolver {
    private browser: Browser
    private config: Config
    constructor(browser: Browser, config: Config) {
        this.browser = browser
        this.config = config
    }
    async openPage(url: string) {
        const page = await this.browser.newPage();
        await page.setUserAgent(this.config.network.userAgent);
        page.setDefaultNavigationTimeout(this.config.network.navigationTimeout);
        await page.goto(url);
        return page;
    }

    async resolveVideoResource(url: string) {
        let page: MaybePage
        try {
            page = await this.openPage(url)
            if (!page) {
                throw new Error('failed to open page')
            }
        } catch (err) {
            throw err
        }
        if (this.isHomePage(page.url())) {
            return null
        }
        return await getVideoSource(page);
    }

    isVideoPage() {

    }

    isHomePage(url: string) {
        return url.includes("user");
    }

    async resolveVideoPageFromAny(anyURL: string) {
        let page: MaybePage
        try {
            page = await this.openPage(anyURL)
            if (!page) {
                throw new Error(`failed to open ${anyURL}`)
            }
        } catch (err) {
            throw err
        }

        const isHomePage = this.isHomePage(page.url())

        let homePage: MaybePage;

        if (isHomePage) {
            console.log(`${page.url()} is HomePage, skip resolve homePage`);
            homePage = page;
        } else {
            console.log(`Try to resolving homePage`);
            const homePageURL = await getHomePageURL(page);
            await page.close();
            console.log(`Resolving home page at ${homePageURL}`);
            try {
                homePage = await this.openPage(homePageURL);
                if (!homePage) {
                    throw new Error(`failed to open homepage url ${homePageURL}`)
                }
            } catch (err) {
                throw err
            }
        }
        await autoScroll(homePage!);

        const videoURLs: string[] = await getVideoURLs(homePage!);
        await homePage!.close();
        return videoURLs
    }

    async destory() {
        const pages = await this.browser.pages()
        if (pages.length) {
            await Promise.all(
                pages.map(async p => p.close())
            )
        }
        await this.browser.close()
    }
}