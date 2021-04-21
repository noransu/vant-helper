'use strict';

const Path = require('path');
import DocSet from './docset';
import Resource from './resource';
import { ExtensionContext } from 'vscode';

// interface RepoObject {
//   name: string;
//   type: string;
//   links: object;
// }

class Library {
  static REFRESH_PERIOD_MS_ = 2 * 60 * 60 * 1000;
  static DEFAULT_DOCSETS = new Set([
    'vant'
  ]);

  catalog: any;
  repos: any;
  cmd: string;
  context: ExtensionContext;

  constructor(context: ExtensionContext) {
    this.catalog = null;
    this.context = context;
    this.fetchRepo();
    this.cmd = '';
  }

  // id: type
  get(id) {
    return this.catalog[id];
  }

  queryAll() {
    let ret = [];
    for (const id in this.catalog) {
      ret = ret.concat(this.catalog[id].queryAll());
    }
    return ret;
  }

  fetchRepo() {
    return Resource.get(Path.join(Resource.RESOURCE_PATH, Resource.RESOURCE_REPO))
      .then((result: string) => {
        this.repos = JSON.parse(result);
        this.buildCatalog(this.repos);
      }).catch(error => {
        console.log('fetchRepo error: ', error);
      });
  }

  setLoading(value: boolean) {
    this.context.workspaceState.update('vant-helper.loading', value);
  }

  getValues(obj) {
    let values = [];
    for (let key in obj) {
      values.push(obj[key]);
    }
    return values;
  }

  buildCatalog(repos) {
    const catalog = {};

    for (let i = 0; i < repos.length; ++i) {
      const repo = repos[i];
      catalog[repo.type] = new DocSet(repo);
    }
    this.catalog = catalog;
  }
}

export default Library;
