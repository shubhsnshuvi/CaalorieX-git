import { spawn } from "child_process"
import * as path from "path"

// Path to the fetch-and-populate-nccdb.ts script
const scriptPath = path.join(__dirname, "fetch-and-populate-nccdb.ts")

console.log(`Running NCCDB population script: ${scriptPath}`)

// Run the script using tsx
const child = spawn("npx", ["tsx", scriptPath], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: "development",
  },
})

child.on("close", (code) => {
  if (code === 0) {
    console.log("NCCDB population completed successfully!")
  } else {
    console.error(`NCCDB population failed with code ${code}`)
    process.exit(code || 1)
  }
})
