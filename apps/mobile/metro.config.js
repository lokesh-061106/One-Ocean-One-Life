const fs = require('fs');
const os = require('os');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const PROJECT_ROOT = __dirname;
const ASSETS_DIR = path.resolve(PROJECT_ROOT, 'assets');
const REQUEST_LOG = path.join(os.tmpdir(), 'opencode', 'metro-requests.log');
const NOISE = /^\/(hot|message|status|inspector|ui)/;

let requestLogStream = null;

function logRequest(entry) {
  try {
    fs.mkdirSync(path.dirname(REQUEST_LOG), { recursive: true });
    if (!requestLogStream) {
      requestLogStream = fs.createWriteStream(REQUEST_LOG, { flags: 'a' });
    }
    requestLogStream.write(entry);
  } catch (error) {}
}

function isFile(target) {
  try {
    return fs.statSync(target).isFile();
  } catch (error) {
    return false;
  }
}

function isInsideProject(target) {
  const relative = path.relative(PROJECT_ROOT, target);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function rewriteLegacyAssetRequest(req) {
  const url = typeof req.url === 'string' ? req.url : '';
  const queryIndex = url.indexOf('?');
  const pathname = queryIndex === -1 ? url : url.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : url.slice(queryIndex + 1);
  if (!pathname.startsWith('/assets/') || query.includes('unstable_path')) {
    return;
  }

  let relative;
  try {
    relative = decodeURIComponent(pathname.slice('/assets/'.length));
  } catch (error) {
    return;
  }
  if (!relative || relative.includes('?') || relative.includes('\0')) {
    return;
  }

  const asRequested = path.resolve(PROJECT_ROOT, relative);
  if (isInsideProject(asRequested) && isFile(asRequested)) {
    return;
  }

  const inAssetsDir = path.resolve(ASSETS_DIR, relative);
  if (isInsideProject(inAssetsDir) && isFile(inAssetsDir)) {
    req.url =
      '/assets/?unstable_path=' +
      encodeURIComponent(`./assets/${relative}`) +
      (query ? `&${query}` : '');
  }
}

const REAL_SITEMAP = path.resolve(__dirname, 'expo-sitemap-shim.tsx');
const FROM_EXPO_ROUTER = /[\\/]expo-router[\\/](?:build|src)[\\/]/;
const SITEMAP_REQUEST = /(?:^|[./\\])views[./\\]Sitemap$/;

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = context.originModulePath || '';
  if (FROM_EXPO_ROUTER.test(origin) && SITEMAP_REQUEST.test(moduleName)) {
    return context.resolveRequest(context, REAL_SITEMAP, platform);
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.server = config.server || {};
const previousEnhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (metroMiddleware, server) => {
  const enhanced = previousEnhanceMiddleware
    ? previousEnhanceMiddleware(metroMiddleware, server)
    : metroMiddleware;
  return (req, res, next) => {
    const rawUrl = typeof req.url === 'string' ? req.url : '';
    rewriteLegacyAssetRequest(req);
    if (!NOISE.test(rawUrl)) {
      const remote = (req.socket && req.socket.remoteAddress) || '-';
      res.once('finish', () => {
        logRequest(
          `${new Date().toISOString()} pid=${process.pid} ${req.method} ${rawUrl} -> ${res.statusCode} from ${remote}\n`,
        );
      });
    }
    return enhanced(req, res, next);
  };
};

module.exports = config;
