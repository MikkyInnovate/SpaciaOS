/**
 * PACIA FRONTEND TEST HARNESS & RUNTIME ENVIRONMENT
 * 
 * Sets up on-the-fly TypeScript and TSX compilation using TypeScript 5 compiler API,
 * registers '@/*' path aliases matching tsconfig.json, provides simulated DOM utilities,
 * and exposes standard assertion and test structure functions (describe, it, expect).
 */

const Module = require("module");
const path = require("path");
const fs = require("fs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const ts = require("typescript");

function findProjectRoot(startDir?: string): string {
  const candidates = [
    startDir,
    typeof __dirname !== "undefined" && __dirname !== "." ? __dirname : "",
    typeof __filename !== "undefined" && __filename !== "[eval]" ? path.dirname(__filename) : "",
    typeof module !== "undefined" && (module as any)?.filename ? path.dirname((module as any).filename) : "",
    "/Users/admin/.gemini/antigravity-ide/scratch/SpaciaOS/test/frontend",
    process.cwd(),
  ].filter((p): p is string => Boolean(p) && p !== ".");

  for (const candidate of candidates) {
    let cur = path.resolve(candidate);
    while (cur !== path.dirname(cur)) {
      if (fs.existsSync(path.join(cur, "package.json")) && fs.existsSync(path.join(cur, "src"))) {
        return cur;
      }
      cur = path.dirname(cur);
    }
  }
  return process.cwd();
}

export const ROOT_DIR = findProjectRoot();
export const SRC_DIR = path.join(ROOT_DIR, "src");
export const NODE_MODULES_DIR = path.join(ROOT_DIR, "node_modules");

// Ensure node_modules of SpaciaOS is searched
if (typeof module !== "undefined" && module.paths && !module.paths.includes(NODE_MODULES_DIR)) {
  module.paths.push(NODE_MODULES_DIR);
}
if ((Module as any).globalPaths && !(Module as any).globalPaths.includes(NODE_MODULES_DIR)) {
  (Module as any).globalPaths.push(NODE_MODULES_DIR);
}

// 1. Shim global.fetch to handle relative paths in Node environment
if (typeof global.fetch === "function") {
  const origFetch = global.fetch;
  global.fetch = async function (input: any, init?: any) {
    if (typeof input === "string" && input.startsWith("/")) {
      const baseUrl = process.env.BACKEND_API_URL || "http://localhost:8000";
      try {
        return await origFetch(`${baseUrl}${input}`, init);
      } catch {
        // Return simulated 503 response so that apiClient throws ApiError and activates fallback
        return new Response(JSON.stringify({ success: false, error: { message: "Backend offline" } }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    return origFetch(input, init);
  };
}

// 2. Register TS & TSX On-The-Fly Compilation
(require.extensions as any)[".ts"] = (require.extensions as any)[".tsx"] = function (
  module: any,
  filename: string
) {
  // Prevent re-compiling external modules
  if (filename.includes("node_modules")) {
    const content = fs.readFileSync(filename, "utf8");
    return module._compile(content, filename);
  }

  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    fileName: filename,
  });

  module._compile(compiled.outputText, filename);
};

// 3. Register '@/*' Path Alias Resolution with Extension Probing
const origResolve = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function (request: string, parent: any, isMain: boolean) {
  if (request.startsWith("@/")) {
    const subPath = request.substring(2);
    const candidateBase = path.join(SRC_DIR, subPath);

    const extensions = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"];
    for (const ext of extensions) {
      const probe = candidateBase + ext;
      if (fs.existsSync(probe) && !fs.statSync(probe).isDirectory()) {
        return origResolve.call(this, probe, parent, isMain);
      }
    }
    return origResolve.call(this, candidateBase, parent, isMain);
  }
  return origResolve.call(this, request, parent, isMain);
};

// 3.5 Intercept 'next/navigation' for safe SSR/DOM testing outside Next.js App Router context
const origLoad = (Module as any)._load;
(Module as any)._load = function (request: string, parent: any, isMain: boolean) {
  if (request === "next/navigation") {
    const actual = origLoad.call(this, request, parent, isMain);
    return {
      ...actual,
      useRouter: () => ({
        push: () => {},
        replace: () => {},
        back: () => {},
        forward: () => {},
        refresh: () => {},
        prefetch: () => {},
      }),
      usePathname: () => "/dashboard",
      useSearchParams: () => new URLSearchParams(),
      useParams: () => ({}),
    };
  }
  return origLoad.call(this, request, parent, isMain);
};

// 4. Test Runner Context & Assertion Library
export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: Error;
  durationMs: number;
}

export class TestRunner {
  private currentSuite = "Default Suite";
  public results: TestResult[] = [];

  async describe(suiteName: string, fn: () => void | Promise<void>) {
    this.currentSuite = suiteName;
    console.log(`\n  \x1b[1m\x1b[34m●\x1b[0m \x1b[1m${suiteName}\x1b[0m`);
    await fn();
  }

  async it(testName: string, fn: () => void | Promise<void>) {
    const start = Date.now();
    try {
      await fn();
      const durationMs = Date.now() - start;
      this.results.push({
        suite: this.currentSuite,
        name: testName,
        passed: true,
        durationMs,
      });
      console.log(`    \x1b[32m✔\x1b[0m \x1b[90m${testName}\x1b[0m \x1b[90m(${durationMs}ms)\x1b[0m`);
    } catch (err: any) {
      const durationMs = Date.now() - start;
      this.results.push({
        suite: this.currentSuite,
        name: testName,
        passed: false,
        error: err,
        durationMs,
      });
      console.log(`    \x1b[31m✖\x1b[0m \x1b[31m${testName}\x1b[0m \x1b[90m(${durationMs}ms)\x1b[0m`);
      console.log(`      \x1b[31m${err?.message || err}\x1b[0m`);
    }
  }
}

export const runner = new TestRunner();
export const describe = runner.describe.bind(runner);
export const it = runner.it.bind(runner);

// 5. Assertion Utility
export function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected [${expected}] but received [${actual}]`);
      }
    },
    toEqual(expected: any) {
      const actStr = JSON.stringify(actual);
      const expStr = JSON.stringify(expected);
      if (actStr !== expStr) {
        throw new Error(`Deep equality failed:\nExpected: ${expStr}\nReceived: ${actStr}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value but received [${actual}]`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy value but received [${actual}]`);
      }
    },
    toContain(expectedSubstringOrItem: any) {
      if (typeof actual === "string") {
        if (!actual.includes(expectedSubstringOrItem)) {
          throw new Error(`Expected string to contain "${expectedSubstringOrItem}", but it was:\n${actual}`);
        }
      } else if (Array.isArray(actual)) {
        if (!actual.includes(expectedSubstringOrItem)) {
          throw new Error(`Expected array to contain item ${JSON.stringify(expectedSubstringOrItem)}`);
        }
      } else {
        throw new Error(`toContain requires string or array, got ${typeof actual}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== "number" || actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (typeof actual !== "number" || actual < expected) {
        throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      if (typeof actual !== "number" || actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined, but got undefined`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, but received [${actual}]`);
      }
    },
  };
}

// 6. Component Render & HTML Inspection Utility
export interface RenderResult {
  html: string;
  getByText(text: string): boolean;
  containsClass(className: string): boolean;
  hasAttribute(attr: string, value?: string): boolean;
}

export function render(element: React.ReactElement): RenderResult {
  const html = ReactDOMServer.renderToStaticMarkup(element);
  return {
    html,
    getByText(text: string): boolean {
      const normalized = html
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
      return normalized.includes(text);
    },
    containsClass(className: string): boolean {
      return new RegExp(`class="[^"]*\\b${className}\\b[^"]*"`).test(html);
    },
    hasAttribute(attr: string, value?: string): boolean {
      if (value !== undefined) {
        return html.includes(`${attr}="${value}"`);
      }
      return new RegExp(`\\b${attr}(?:=|[ >])`).test(html);
    },
  };
}
