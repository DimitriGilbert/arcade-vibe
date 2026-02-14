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

declare global {
  interface HTMLElementTagNameMap {
    "strudel-repl": HTMLElement & {
      code: string;
    };
  }
}

export {};