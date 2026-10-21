const { getDefaultConfig } = require("expo/metro-config");
const fs = require("fs");
const path = require("path");

const config = getDefaultConfig(__dirname);
const thin = fs.existsSync(path.join(__dirname, ".thin-bundle"));

if (thin) {
  const stub = path.join(__dirname, "src/data/catalogue-stub.json");
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    const name = moduleName.replaceAll("\\", "/");
    if (name.endsWith("/archive.json") || name.endsWith("/drugs-extra.json")) {
      return { type: "sourceFile", filePath: stub };
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
