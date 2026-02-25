// src/index.ts
async function loadGhostscriptWASM(options) {
  let baseUrl = options?.baseUrl ?? "./";
  if (!baseUrl.endsWith("/")) {
    baseUrl += "/";
  }
  const jsUrl = `${baseUrl}gs.js`;
  const gsModule = await import(
    /* @vite-ignore */
    jsUrl
  );
  const ModuleFactory = gsModule.default;
  const locateFile = options?.locateFile ?? ((path) => {
    if (path.endsWith(".wasm")) {
      return options?.wasmUrl ?? `${baseUrl}gs.wasm`;
    }
    return `${baseUrl}${path}`;
  });
  return ModuleFactory({
    locateFile,
    print: options?.print,
    printErr: options?.printErr
  });
}
var src_default = loadGhostscriptWASM;
export {
  src_default as default,
  loadGhostscriptWASM
};
