import fs from "node:fs";
import { Builder, By, until } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome.js";

const EMAIL = process.env.SELENIUM_EMAIL || "luis@gmail.com";
const PASSWORD = process.env.SELENIUM_PASSWORD || "Administrador166*";

const REPORT_DIR = "reportes/login";
const report = {
  testName: "Login - Debe iniciar sesión correctamente",
  startedAt: new Date().toISOString(),
  passed: false,
  finalUrl: "",
  steps: [],
  error: null,
};

function addStep(name, ok, details = "") {
  report.steps.push({
    name,
    ok,
    details,
    at: new Date().toISOString(),
  });
}

function saveReport() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const reportPath = `${REPORT_DIR}/selenium-report.json`;
  const textPath = `${REPORT_DIR}/selenium-report.txt`;

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const lines = [
    "=== INFORME DE PRUEBA SELENIUM ===",
    `Nombre: ${report.testName}`,
    `Estado: ${report.passed ? "PASS" : "FAIL"}`,
    `Inicio: ${report.startedAt}`,
    `URL final: ${report.finalUrl || "N/A"}`,
    "",
    "Pasos:",
    ...report.steps.map((step) => `- ${step.name}: ${step.ok ? "OK" : "FAIL"}${step.details ? ` | ${step.details}` : ""}`),
  ];

  if (report.error) {
    lines.push("", `Error: ${report.error}`);
  }

  fs.writeFileSync(textPath, lines.join("\n"));
  console.log(`Informe guardado en: ${reportPath}`);
  console.log(`Resumen guardado en: ${textPath}`);
}

async function loginTest() {
  const chromeOptions = new Options();
  chromeOptions.addArguments("--no-sandbox");
  chromeOptions.addArguments("--disable-dev-shm-usage");
  chromeOptions.addArguments("--disable-gpu");
  chromeOptions.addArguments("--window-size=1920,1080");

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(chromeOptions)
    .build();

  try {
    const urls = [
      "http://localhost:5173/login",
      "http://localhost:5174/login",
      "http://localhost:5173",
      "http://localhost:5174",
    ];

    let loaded = false;
    for (const url of urls) {
      try {
        await driver.get(url);
        await driver.wait(until.elementLocated(By.css('input[name="email"]')), 8000);
        loaded = true;
        addStep("Abrir página de login", true, `URL: ${url}`);
        break;
      } catch {
        // intenta con la siguiente URL
      }
    }

    if (!loaded) {
      throw new Error("No se pudo abrir la página de login");
    }

    const emailInput = await driver.findElement(By.css('input[name="email"]'));
    const passwordInput = await driver.findElement(By.css('input[name="password"]'));
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));

    await emailInput.clear();
    await emailInput.sendKeys(EMAIL);
    addStep("Escribir correo", true, `Correo usado: ${EMAIL}`);

    await passwordInput.clear();
    await passwordInput.sendKeys(PASSWORD);
    addStep("Escribir contraseña", true, "Contraseña ingresada");

    await loginButton.click();
    addStep("Hacer clic en Login", true, "Se envió el formulario");

    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes("/principal") || url.includes("/admin") || url.includes("/profesor");
    }, 15000).catch(() => null);

    report.finalUrl = await driver.getCurrentUrl();
    report.passed = report.finalUrl.includes("/principal") || report.finalUrl.includes("/admin") || report.finalUrl.includes("/profesor");

    if (report.passed) {
      addStep("Validar inicio de sesión", true, `Redirección: ${report.finalUrl}`);
      console.log("URL final:", report.finalUrl);
      console.log("Login exitoso");
    } else {
      addStep("Validar inicio de sesión", false, `Se quedó en: ${report.finalUrl}`);
      console.log("URL final:", report.finalUrl);
      console.log("Login fallido");
    }

    const screenshot = await driver.takeScreenshot();
    fs.mkdirSync(REPORT_DIR, { recursive: true });
    fs.writeFileSync(`${REPORT_DIR}/selenium-login.png`, screenshot, "base64");
    console.log(`Captura guardada en: ${REPORT_DIR}/selenium-login.png`);
  } catch (error) {
    report.error = error.message;
    addStep("Ejecución general", false, error.message);
    console.error("Error en el test:", error.message);
  } finally {
    report.finishedAt = new Date().toISOString();
    saveReport();
    await driver.quit();
  }
}

(async () => {
  await loginTest();
})();
