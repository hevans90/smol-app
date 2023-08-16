import { promisify } from "util";
import { parseStringPromise } from "xml2js";
import { inflate } from "zlib";
import { BuildItem, parseItem } from "./item";

export class PoBDecoder {
  async decode(encodedString: string): Promise<any> {
      const decodedData = this.decodeBase64(encodedString);
      const decompressedData = await this.decompress(decodedData);
      return this.parseXML(decompressedData);
  }

  decodeBase64(data: string): Buffer {
      return Buffer.from(data, 'base64');
  }

  async decompress(data: Buffer): Promise<string> {
      const asyncInflate = promisify(inflate);
      const decompressedData = await asyncInflate(data);
      return decompressedData.toString('utf-8');
  }

  async parseXML(data: string): Promise<any> {
      return await parseStringPromise(data);
  }

  // how is the itemSet visualized? More tests!
  async extractItems(parsedData: any): Promise<BuildItem[]> {
      const resultItems: BuildItem[] = [];
      if (parsedData!.PathOfBuilding!.Items[0]) {
          // XML parsed down to one item
          // parsedData.PathOfBuilding.Items[0].Item[0]._
          const items = parsedData.PathOfBuilding.Items[0].Item
          for (const item of items) {
              resultItems.push(await parseItem(item!._));
          }
      }
      return resultItems;
  }
}