export interface Browser {
  newPage: () => Promise<Page>;
  close: () => Promise<Any>;
}

type Any = number | string | boolean | null | void;

export interface Page {
  url: () => string;
  waitForFunction: () => Promise<Any>;
  evaluate: (fn: () => Promise<Any>) => void;
  setUserAgent: (userAgent: string) => Promise<Any>;
  setDefaultNavigationTimeout: (timeout: number) => Promise<Any>;
  goto: (url: string) => Promise<Any>;
  close: () => Promise<Any>;
}
