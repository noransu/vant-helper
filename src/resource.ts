/* eslint-disable @typescript-eslint/naming-convention */
'use strict';

const fs = require('fs');
const Path = require('path');

import { Uri } from 'vscode';

export default class Resource {
  // resources local path
  static RESOURCE_PATH: string = Path.join(__dirname, '../', 'resources');

  static URL_REG: RegExp = /((?:src|href)\s*=\s*)(['"])(\/\/[^'"]*)\2/g;
  static VANT_HOME_URL: string = 'https://vant-contrib.gitee.io/';
  static RESOURCE_REPO: string = 'repos.json';

  static get(filePath: string) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) reject('ReadFail');

        resolve(data);
      });
    });
  }

  static getExtensionFileVscodeResource(diskPath: Uri): string {
    return diskPath.with({ scheme: 'vscode-resource' }).toString();
  }

  // TODO when to update
}
