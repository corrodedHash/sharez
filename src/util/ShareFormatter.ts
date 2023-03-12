export class ShareFormatter {
  share_id: number | undefined;
  share_data: Uint8Array;

  constructor(share_id: number | undefined, share_data: Uint8Array) {
    this.share_id = share_id;
    this.share_data = share_data;
  }

  static fromString(input: string): ShareFormatter {
    if (input.startsWith("$")) {
      const data_str = input.slice(1);
      const data = [...atob(data_str)].map((v) => v.charCodeAt(0));
      return new ShareFormatter(data[0], Uint8Array.from(data.slice(1)));
    }

    const data = [...atob(input)].map((v) => v.charCodeAt(0));
    return new ShareFormatter(undefined, Uint8Array.from(data.slice(1)));
  }
  toString(): string {
    if (this.share_id === undefined) {
      return btoa(String.fromCharCode(...this.share_data));
    }
    const output = Uint8Array.from([this.share_id, ...this.share_data]);
    return "$" + btoa(String.fromCharCode(...output));
  }
}
