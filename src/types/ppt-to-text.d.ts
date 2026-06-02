declare module "ppt-to-text" {
  interface PptPresentation {
    slides?: unknown[];
    docs?: unknown[];
  }

  interface PptModule {
    readBuffer(buffer: Buffer): PptPresentation;
    utils: {
      to_text(pres: PptPresentation): string[];
    };
  }

  const PPT: PptModule;
  export = PPT;
}
