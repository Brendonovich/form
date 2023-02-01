import path from "path";
import { BranchConfig, Package } from "./types";

// TODO: List your npm packages here.
export const packages: Package[] = [
  {
    name: "@brendonovich/form",
    packageDir: "form",
    srcDir: "src",
    jsName: "Form",
    entryFile: "src/index.ts",
    globals: {},
  },
  {
    name: "@brendonovich/react-form",
    packageDir: "react-form",
    srcDir: "src",
    jsName: "ReactForm",
    entryFile: "src/index.tsx",
    globals: {
      react: "React",
    },
  },
  {
    name: "@brendonovich/solid-form",
    packageDir: "solid-form",
    srcDir: "src",
    jsName: "SolidForm",
    entryFile: "src/index.tsx",
    globals: {
      ["solid-js"]: "Solid",
    },
  },
];

export const latestBranch = "main";

export const branchConfigs: Record<string, BranchConfig> = {
  main: {
    prerelease: false,
    ghRelease: true,
  },
  // next: {
  //   prerelease: true,
  //   ghRelease: true,
  // },
  // beta: {
  //   prerelease: true,
  //   ghRelease: true,
  // },
  // alpha: {
  //   prerelease: true,
  //   ghRelease: true,
  // },
};

export const rootDir = path.resolve(__dirname, "..");
export const examplesDirs = [
  // "examples/react",
  // 'examples/solid',
  // 'examples/svelte',
  // 'examples/vue',
];
