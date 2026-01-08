#!/usr/bin/env bun

import { $ } from "bun";

const version = (await $`bun pm pkg get version`.text()).trim().replace(/"/g, "");
const target = process.argv[2];

const outfile = target ? `dist/chief-${target.replace("bun-", "")}` : "dist/chief";
const targetFlag = target ? `--target=${target}` : "";

console.log(`Building chief v${version}${target ? ` for ${target}` : ""}`);

await $`bun build --compile src/index.ts --outfile ${outfile} ${targetFlag} --define "process.env.VERSION='${version}'"`;
