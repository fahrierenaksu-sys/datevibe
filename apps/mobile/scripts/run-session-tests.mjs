import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const outputDirectory = mkdtempSync(join(tmpdir(), "datevibe-session-tests-"))
const testNames = [
  "sessionApi",
  "sessionLifecycle",
  "sessionModel",
  "sessionPersistence",
  "sessionRouting"
]
const sourceDirectory = "src/features/session"
const sourceFiles = testNames.flatMap((name) => [
  `${sourceDirectory}/${name}.ts`,
  `${sourceDirectory}/${name}.test.ts`
])

try {
  execFileSync(
    process.execPath,
    [
      resolve(workspaceRoot, "../../node_modules/typescript/bin/tsc"),
      ...sourceFiles,
      "--target",
      "ES2022",
      "--module",
      "commonjs",
      "--moduleResolution",
      "node",
      "--outDir",
      outputDirectory,
      "--esModuleInterop",
      "--skipLibCheck"
    ],
    {
      cwd: workspaceRoot,
      stdio: "inherit"
    }
  )

  execFileSync(
    process.execPath,
    [
      "--experimental-test-coverage",
      "--test",
      ...testNames.map((name) =>
        join(outputDirectory, `${name}.test.js`)
      )
    ],
    {
      cwd: workspaceRoot,
      stdio: "inherit"
    }
  )
} finally {
  rmSync(outputDirectory, { recursive: true, force: true })
}
