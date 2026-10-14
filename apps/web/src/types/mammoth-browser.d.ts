declare module "mammoth/mammoth.browser" {
  interface MammothResult {
    value: string;
    messages: unknown[];
  }
  const mammoth: {
    convertToHtml(
      input: { arrayBuffer: ArrayBuffer },
      options?: Record<string, unknown>
    ): Promise<MammothResult>;
  };
  export default mammoth;
}
