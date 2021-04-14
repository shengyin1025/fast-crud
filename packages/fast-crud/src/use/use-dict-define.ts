import _ from "lodash-es";
import { useMerge } from "./use-merge";
import logger from "../utils/util.log";
import { reactive } from "vue";
import LRU from "lru-cache";
const DictGlobalCache = new LRU(100); //全局cache， sets just the max size

const { UnMergeable } = useMerge();

function setDictRequest(request) {
  dictRequest = request;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
let dictRequest = async ({ url, dict }) => {
  logger.warn("请配置 app.use(FsCrud,{dictRequest:(context)=>{ 你的字典请求方法 }})");
  return [];
};

/**
 *
 * @param url
 * @param context = {dict, scope}
 * @returns {Promise<*>}
 */
class Dict extends UnMergeable {
  cache = false; // 获取到结果是否进行全局缓存
  prototype = false; // 是否原型配置
  immediate = true; //是否立即请求
  url: undefined | String | Function = undefined;
  getData: undefined | Function = undefined;
  value = "value";
  label = "label";
  children = "children";
  color = "color";
  isTree = false;
  data: undefined | Array<any> = undefined;
  originalData: undefined | Array<any> = undefined;
  dataMap = {};
  loading = false;
  custom = {};
  getNodesByValues: undefined | Function = undefined;
  cacheNodes = {};
  onReady: undefined | Function = undefined;
  constructor(dict) {
    super();

    // 设置为不可枚举,就不会在clone的时候复制值，导致不会loadDict的bug
    Object.defineProperty(this, "loading", {
      value: false,
      enumerable: false
    });
    this.loading = false;
    _.merge(this, dict);
    if (dict.data != null) {
      this.originalData = dict.data;
      this.setData(dict.data);
    }
  }

  isDynamic() {
    return this.url instanceof Function || this.getData instanceof Function || this.prototype;
  }

  setData(data) {
    this.data = data;
    this.toMap();
  }

  async loadDict(context?) {
    if (this.loading) {
      return;
    }
    if (this.data) {
      return;
    }
    let data: Array<any> = [];
    if (this.getNodesByValues) {
      if (context.value) {
        let cacheKey = null;
        if (this.cache && this.url) {
          cacheKey = this.url + context.value;
        }
        let cached = null;

        if (cacheKey) {
          cached = DictGlobalCache.get(cacheKey);
        }
        if (cached) {
          data = cached;
        } else {
          data = await this.getNodesByValues(context.value, context);
          if (cacheKey) {
            DictGlobalCache.set(cacheKey, data);
          }
        }
      }
    } else if (this.originalData) {
      data = this.originalData;
    } else {
      this.loading = true;
      try {
        data = await this.getRemoteDictData(context);
      } finally {
        this.loading = false;
      }
    }
    this.setData(data);
    if (this.onReady) {
      this.onReady({ dict: this, ...context });
    }
  }

  async reloadDict(context?) {
    this.clear();
    return this.loadDict(context);
  }

  clear() {
    this.data = undefined;
    this.dataMap = {};
  }

  async getRemoteDictData(context?) {
    let getFromRemote;
    let cacheKey;
    if (this.getData != null) {
      cacheKey = this.getData;
      getFromRemote = async () => {
        // @ts-ignore
        return await this.getData({ dict: this, ...context });
      };
    } else if (this.url) {
      let url = this.url;
      if (url instanceof Function) {
        url = url({ ...context, dict: this });
      }
      if (url == null) {
        return;
      }
      cacheKey = url;
      getFromRemote = async () => {
        return await dictRequest({ url, dict });
      };
    } else {
      return [];
    }
    if (this.cache) {
      let cached = DictGlobalCache.get(cacheKey);

      if (cached == null) {
        cached = {
          loaded: false,
          loading: true,
          data: undefined,
          callback: []
        };
        DictGlobalCache.set(cacheKey, cached);
      } else if (cached.loaded) {
        return cached.data;
      } else if (cached.loading) {
        return new Promise((resolve) => {
          const callback = (data) => {
            resolve(data);
          };
          cached.callback.push(callback);
        });
      }

      try {
        cached.loaded = false;
        cached.loading = true;
        const dictData = await getFromRemote();
        cached.data = dictData;
        cached.loaded = true;
        cached.loading = false;
        for (const callback of cached.callback) {
          callback(dictData);
        }
        cached.callback = [];
        return dictData;
      } catch (e) {
        cached.loading = false;
        cached.loaded = false;
        logger.error("load dict error:", e);
      }
    }

    return await getFromRemote();
  }

  toMap() {
    const map = {};
    if (this.data) {
      this.buildMap(map, this.data);
    }
    // if (this.getNodesByValues) {
    //   _.merge(this.dataMap, map);
    // }
    this.dataMap = map;
  }
  buildMap(map, list) {
    _.forEach(list, (item) => {
      map[this.getValue(item)] = item;
      if (this.isTree && this.getChildren(item)) {
        this.buildMap(map, this.getChildren(item));
      }
    });
  }

  getValue(item) {
    return item[this.value];
  }
  getLabel(item) {
    return item[this.label];
  }
  getChildren(item) {
    return item[this.children];
  }
  getColor(item) {
    return item[this.color];
  }
  getDictData() {
    return this.data;
  }

  getDictMap() {
    return this.dataMap;
  }

  getNodeByValue(value) {
    return this.dataMap[value];
  }

  getNodesFromDataMap(value) {
    if (value == null) {
      return [];
    }
    if (!_.isArray(value)) {
      value = [value];
    }
    //本地获取
    const nodes: Array<any> = [];
    _.forEach(value, (item) => {
      const node = this.dataMap[item];
      if (node) {
        nodes.push(node);
      }
    });
    return nodes;
  }
}

function dict(config) {
  const ret = reactive(new Dict(config));
  if (ret.immediate && !ret.prototype) {
    ret.loadDict();
  }
  return ret;
}
export function useDictDefine() {
  return {
    dict,
    setDictRequest,
    Dict
  };
}
