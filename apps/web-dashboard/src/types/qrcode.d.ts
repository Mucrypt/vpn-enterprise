declare module 'qrcode' {
  export function toDataURL(text: string, options?: any): Promise<string>;
  export function toCanvas(text: string, canvas: HTMLCanvasElement, options?: any): Promise<void>;
}
