declare namespace JSX {
  interface IntrinsicElements {
    "strudel-repl": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        code?: string;
      },
      HTMLElement
    >;
  }
}

declare module "@strudel/web" {
  export type StrudelRepl = {
    scheduler: { stop: () => void };
    evaluate: (code: string, autoplay?: boolean) => Promise<void>;
  };

  export type StrudelInitOptions = {
    prebake?: () => Promise<void> | void;
    miniAllStrings?: boolean;
  };

  export function initStrudel(options?: StrudelInitOptions): Promise<StrudelRepl>;
  export function samples(source: string, base?: string): Promise<void>;
}

declare module "@strudel/web/web.mjs" {
  export type StrudelRepl = {
    scheduler: { stop: () => void };
    evaluate: (code: string, autoplay?: boolean) => Promise<void>;
  };

  export type StrudelInitOptions = {
    prebake?: () => Promise<void> | void;
    miniAllStrings?: boolean;
  };

  export function initStrudel(options?: StrudelInitOptions): Promise<StrudelRepl>;
  export function samples(source: string, base?: string): Promise<void>;
}

declare module "@strudel/soundfonts" {
  export function registerSoundfonts(): Promise<void> | void;
}

declare module "@strudel/soundfonts/index.mjs" {
  export function registerSoundfonts(): Promise<void> | void;
}

interface HTMLElementTagNameMap {
  "strudel-repl": HTMLElement & {
    code: string;
  };
}
