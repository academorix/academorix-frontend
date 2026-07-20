/**
 * @file demo-all-components.ts
 * @module @stackra/console/tests/e2e
 * @description Interactive demo that showcases EVERY UI component in ConsoleOutput.
 *   Run with: npx tsx --tsconfig tsconfig.json __tests__/e2e/demo-all-components.ts
 */

import "reflect-metadata";
import { ConsoleOutput } from "../../src/services/console-output.service";
import { renderBanner } from "../../src/utils/ascii-banner.util";
import { setTheme, VIBRANT_THEME } from "../../src/services/theme.service";

async function demo() {
  const output = new ConsoleOutput();

  // ==========================================================================
  // 1. ASCII ART BANNER
  // ==========================================================================
  const banner = renderBanner({
    name: "STACKRA",
    version: "0.1.0",
    environment: "development",
  });
  process.stdout.write(banner);

  // ==========================================================================
  // 2. INTRO
  // ==========================================================================
  output.intro("Console UI Component Demo");

  // ==========================================================================
  // 3. MESSAGES (info, success, warning, error)
  // ==========================================================================
  output.info("This is an informational message");
  output.success("This is a success message");
  output.warning("This is a warning message");
  output.error("This is an error message");
  output.newLine();

  // ==========================================================================
  // 4. STEP
  // ==========================================================================
  (output as any).step("Running database migrations...");
  (output as any).step("Seeding initial data...");
  (output as any).step("Generating API documentation...");
  output.newLine();

  // ==========================================================================
  // 5. KEY-VALUE PAIRS
  // ==========================================================================
  (output as any).separator(60, "System Info");
  (output as any).pairs({
    "App Name": "stackra",
    Version: "0.1.0",
    "Node.js": process.version,
    Platform: `${process.platform} (${process.arch})`,
    Memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    Uptime: `${Math.round(process.uptime())}s`,
  });
  output.newLine();

  // ==========================================================================
  // 6. TABLE
  // ==========================================================================
  (output as any).separator(60, "Registered Packages");
  output.table(
    ["Package", "Version", "Status", "Commands"],
    [
      ["@stackra/console", "0.1.0", "active", "5"],
      ["@stackra/cache", "0.2.0", "active", "3"],
      ["@stackra/queue", "0.1.5", "active", "4"],
      ["@stackra/events", "0.3.0", "active", "0"],
      ["@stackra/redis", "1.0.0", "active", "2"],
    ],
  );

  // ==========================================================================
  // 7. LIST (bullet, pointer, numbered)
  // ==========================================================================
  (output as any).separator(60, "Lists");

  process.stdout.write("  Bullet style:\n");
  (output as any).list([
    "First item in bullet list",
    "Second item in bullet list",
    "Third item in bullet list",
  ]);
  output.newLine();

  process.stdout.write("  Pointer style:\n");
  (output as any).list(
    ["Navigate to project directory", "Run yarn install", "Start the development server"],
    { style: "pointer" },
  );
  output.newLine();

  process.stdout.write("  Numbered style:\n");
  (output as any).list(
    [
      "Configure database connection",
      "Run migrations",
      "Seed initial data",
      "Start the application",
    ],
    { style: "numbered" },
  );
  output.newLine();

  // ==========================================================================
  // 8. BOX
  // ==========================================================================
  (output as any).box(
    "Important Notice",
    "This is a boxed panel with a title.\nIt supports multiple lines of content.\n\nPerfect for important notices, warnings, or summaries.",
  );

  // ==========================================================================
  // 9. JSON
  // ==========================================================================
  (output as any).separator(60, "JSON Output");
  (output as any).json(
    {
      database: {
        host: "localhost",
        port: 5432,
        name: "stackra_dev",
        ssl: false,
      },
      redis: {
        url: "redis://localhost:6379",
        maxRetries: 3,
      },
      features: ["auth", "cache", "queue"],
      debug: true,
      workers: 4,
    },
    "Application Config:",
  );

  // ==========================================================================
  // 10. LINK
  // ==========================================================================
  (output as any).separator(60, "Links");
  (output as any).link("Stackra Documentation", "https://docs.stackra.com");
  (output as any).link("GitHub Repository", "https://github.com/stackra/monorepo");
  (output as any).link("Issue Tracker", "https://github.com/stackra/monorepo/issues");
  output.newLine();

  // ==========================================================================
  // 11. SPINNER
  // ==========================================================================
  (output as any).separator(60, "Spinner");
  const spinner = output.spinner();
  spinner.start("Connecting to database...");
  await sleep(800);
  spinner.stop("Database connected", 0);

  const spinner2 = output.spinner();
  spinner2.start("Loading configuration...");
  await sleep(600);
  spinner2.stop("Configuration loaded", 0);
  output.newLine();

  // ==========================================================================
  // 12. PROGRESS BAR
  // ==========================================================================
  (output as any).separator(60, "Progress Bar");
  const bar = output.progress({ total: 20, message: "Processing records" });
  for (let i = 0; i < 20; i++) {
    await sleep(80);
    bar.increment();
  }
  bar.finish("All 20 records processed successfully");
  output.newLine();

  // ==========================================================================
  // 13. TASKS
  // ==========================================================================
  (output as any).separator(60, "Sequential Tasks");
  await output.tasks([
    {
      title: "Installing dependencies",
      task: async () => {
        await sleep(500);
      },
    },
    {
      title: "Compiling TypeScript",
      task: async () => {
        await sleep(400);
      },
    },
    {
      title: "Running tests",
      task: async () => {
        await sleep(300);
      },
    },
    {
      title: "Skipped task (disabled)",
      task: async () => {},
      enabled: false,
    },
    {
      title: "Building production bundle",
      task: async () => {
        await sleep(200);
      },
    },
  ]);
  output.newLine();

  // ==========================================================================
  // 14. INTERACTIVE PROMPTS (only in TTY)
  // ==========================================================================
  if (process.stdout.isTTY && process.argv.includes("--interactive")) {
    (output as any).separator(60, "Interactive Prompts");

    const name = await output.text("What is your name?", {
      placeholder: "Enter your name...",
      defaultValue: "Developer",
    });
    output.success(`Hello, ${name}!`);

    const confirmed = await output.confirm("Do you want to continue?", {
      initialValue: true,
    });
    output.info(`You chose: ${confirmed ? "Yes" : "No"}`);

    const framework = await output.select("Pick a framework:", [
      { value: "@stackra/container", label: "@stackra/container", hint: "recommended" },
      { value: "express", label: "Express" },
      { value: "fastify", label: "Fastify" },
      { value: "hono", label: "Hono", hint: "edge-native" },
    ]);
    output.success(`Selected: ${framework}`);

    const features = await output.multiselect("Choose features:", [
      { value: "auth", label: "Authentication", hint: "JWT + OAuth2" },
      { value: "cache", label: "Caching", hint: "Redis + Memory" },
      { value: "queue", label: "Queue", hint: "BullMQ" },
      { value: "realtime", label: "Realtime", hint: "Socket.IO" },
      { value: "i18n", label: "Internationalization" },
    ]);
    output.success(`Features: ${features.join(", ")}`);

    output.newLine();
  } else {
    (output as any).separator(60, "Interactive Prompts");
    output.info("Skipped interactive prompts (non-TTY or --interactive flag not passed)");
    output.info("Run with: npx tsx ... demo-all-components.ts --interactive");
    output.newLine();
  }

  // ==========================================================================
  // 15. THEME SWITCH DEMO
  // ==========================================================================
  (output as any).separator(60, "Theme: Vibrant");
  setTheme(VIBRANT_THEME);
  output.info("This message uses the VIBRANT theme");
  output.success("Vibrant success — bold and saturated");
  output.warning("Vibrant warning — high contrast");
  output.error("Vibrant error — unmissable");
  output.newLine();

  // ==========================================================================
  // OUTRO
  // ==========================================================================
  output.outro("Demo complete — all components rendered successfully");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

demo().catch((err) => {
  console.error("Demo failed:", err);
  process.exit(1);
});
