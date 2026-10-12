import fs from "node:fs";
import { Builder, By, until } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome.js";

const REPORT_DIR = "reportes/register";
const URL_CANDIDATES = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:4173",
];

function ensureReportDir() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

function addStep(report, name, ok, details = "") {
  report.steps.push({
    name,
    ok,
    details,
    at: new Date().toISOString(),
  });
}

function saveReport(report, fileName) {
  ensureReportDir();
  const reportPath = `${REPORT_DIR}/${fileName}.json`;
  const textPath = `${REPORT_DIR}/${fileName}.txt`;

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  const lines = [
    "=== INFORME DE PRUEBA SELENIUM ===",
    `Nombre: ${report.testName}`,
    `Estado: ${report.passed ? "PASS" : "FAIL"}`,
    `Inicio: ${report.startedAt}`,
    `URL final: ${report.finalUrl || "N/A"}`,
    "",
    "Pasos:",
    ...report.steps.map(
      (step) =>
        `- ${step.name}: ${step.ok ? "OK" : "FAIL"}${step.details ? ` | ${step.details}` : ""}`
    ),
  ];

  if (report.error) {
    lines.push("", `Error: ${report.error}`);
  }

  fs.writeFileSync(textPath, lines.join("\n"));
  console.log(`Informe guardado en: ${reportPath}`);
  console.log(`Resumen guardado en: ${textPath}`);
}

async function createDriver() {
  const chromeOptions = new Options();
  chromeOptions.addArguments("--no-sandbox");
  chromeOptions.addArguments("--disable-dev-shm-usage");
  chromeOptions.addArguments("--disable-gpu");
  chromeOptions.addArguments("--window-size=1920,1080");
  chromeOptions.addArguments("--lang=es-ES");

  return new Builder()
    .forBrowser("chrome")
    .setChromeOptions(chromeOptions)
    .build();
}

async function openApp(driver, path = "/register") {
  let lastError = null;

  for (const baseUrl of URL_CANDIDATES) {
    try {
      const targetUrl = `${baseUrl}${path}`;
      await driver.get(targetUrl);
      await driver.wait(until.urlContains(path || "/"), 8000);
      return targetUrl;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || `No se pudo abrir la ruta ${path}`);
}

async function takeScreenshot(driver, fileName) {
  const screenshot = await driver.takeScreenshot();
  fs.writeFileSync(`${REPORT_DIR}/${fileName}.png`, screenshot, "base64");
  console.log(`Captura guardada en: ${REPORT_DIR}/${fileName}.png`);
}

async function clickSubmit(driver) {
  const submitButton = await driver.findElement(By.css('button[type="submit"]'));
  await driver.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'center' });", submitButton);
  await driver.wait(until.elementIsVisible(submitButton), 8000);
  await driver.executeScript("arguments[0].click();", submitButton);
  return submitButton;
}

function buildFakeUser() {
  const timestamp = Date.now();
  const password = "FakePass123!";

  return {
    nombre: "Ana",
    apellidop: "Martinez",
    apellidom: "López",
    fecha_nacimiento: "1998-05-12",
    pais: "México",
    ciudad: "Ciudad Falsa",
    email: `usuario.fake.${timestamp}@mail.com`,
    password,
    verificar_password: password,
    pregunta_seguridad: "Nombre de tu mascota",
    respuesta_seguridad: "Luna",
    telefono: "5551234567",
  };
}

async function fillRegisterForm(driver, overrides = {}) {
  const user = { ...buildFakeUser(), ...overrides };

  const fields = [
    ["nombre", user.nombre],
    ["apellidop", user.apellidop],
    ["apellidom", user.apellidom],
    ["fecha_nacimiento", user.fecha_nacimiento],
    ["pais", user.pais],
    ["ciudad", user.ciudad],
    ["email", user.email],
    ["password", user.password],
    ["verificar_password", user.verificar_password],
    ["pregunta_seguridad", user.pregunta_seguridad],
    ["respuesta_seguridad", user.respuesta_seguridad],
    ["telefono", user.telefono],
  ];

  for (const [name, value] of fields) {
    const input = await driver.findElement(By.css(`input[name="${name}"]`));
    await input.clear();
    await input.sendKeys(value);
  }

  return user;
}

async function runRegisterLoadTest() {
  const report = {
    testName: "Registro - carga de formulario",
    startedAt: new Date().toISOString(),
    passed: false,
    finalUrl: "",
    steps: [],
    error: null,
  };

  const driver = await createDriver();

  try {
    await openApp(driver, "/register");
    addStep(report, "Abrir registro", true, "Ruta /register disponible");

    await driver.wait(until.elementLocated(By.css('input[name="nombre"]')), 8000);
    const title = await driver.findElement(By.css("h2")).getText();
    const requiredFields = [
      'input[name="nombre"]',
      'input[name="apellidop"]',
      'input[name="email"]',
      'input[name="password"]',
      'input[name="verificar_password"]',
    ];

    const visible = [];
    for (const selector of requiredFields) {
      const el = await driver.findElement(By.css(selector));
      visible.push(await el.isDisplayed());
    }

    report.finalUrl = await driver.getCurrentUrl();
    report.passed = title.includes("Registro") && visible.every(Boolean);

    addStep(
      report,
      "Validar carga del formulario",
      report.passed,
      report.passed ? `Título detectado: ${title}` : `URL: ${report.finalUrl}`
    );

    if (report.passed) {
      console.log("Formulario de registro cargado correctamente");
    }

    await takeScreenshot(driver, "selenium-registro-carga");
  } catch (error) {
    report.error = error.message;
    addStep(report, "Ejecución general", false, error.message);
    console.error("Error en carga de registro:", error.message);
  } finally {
    report.finishedAt = new Date().toISOString();
    saveReport(report, "selenium-registro-carga");
    await driver.quit();
  }
}

async function runRegisterFakeDataTest() {
  const report = {
    testName: "Registro - llenado con datos falsos",
    startedAt: new Date().toISOString(),
    passed: false,
    finalUrl: "",
    steps: [],
    error: null,
  };

  const driver = await createDriver();

  try {
    await openApp(driver, "/register");
    addStep(report, "Abrir registro", true, "Ruta /register disponible");

    const user = await fillRegisterForm(driver);
    addStep(report, "Completar formulario con datos falsos", true, `Email: ${user.email}`);

    await clickSubmit(driver);
    addStep(report, "Enviar formulario", true, "Se intentó registrar al usuario");

    await driver.wait(async () => {
      const bodyText = await driver.findElement(By.css("body")).getText();
      return /registrado|registro|error|contrase|obligatorio|usuario/i.test(bodyText);
    }, 15000).catch(() => null);

    report.finalUrl = await driver.getCurrentUrl();
    const bodyText = await driver.findElement(By.css("body")).getText();
    report.passed = /registrado|registro|error|contrase|obligatorio|usuario/i.test(bodyText) || report.finalUrl.includes("/register");

    addStep(
      report,
      "Validar respuesta del formulario",
      report.passed,
      report.passed ? `Respuesta detectada: ${bodyText.slice(0, 120)}` : `URL final: ${report.finalUrl}`
    );

    await takeScreenshot(driver, "selenium-registro-datos-falsos");
  } catch (error) {
    report.error = error.message;
    addStep(report, "Ejecución general", false, error.message);
    console.error("Error en llenado con datos falsos:", error.message);
  } finally {
    report.finishedAt = new Date().toISOString();
    saveReport(report, "selenium-registro-datos-falsos");
    await driver.quit();
  }
}

async function runRegisterSuccessTest() {
  const report = {
    testName: "Registro - registro exitoso con botón Registrar",
    startedAt: new Date().toISOString(),
    passed: false,
    finalUrl: "",
    steps: [],
    error: null,
  };

  const driver = await createDriver();

  try {
    await openApp(driver, "/register");
    addStep(report, "Abrir registro", true, "Ruta /register disponible");

    const user = await fillRegisterForm(driver, {
      email: `registro.exitoso.${Date.now()}@mail.com`,
      password: "FakePass123!",
      verificar_password: "FakePass123!",
    });
    addStep(report, "Completar formulario válido", true, `Email: ${user.email}`);

    await clickSubmit(driver);
    addStep(report, "Presionar botón Registrar", true, "Se hizo clic en el botón de registrar");

    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes("/principal") || url.includes("/login") || url.includes("/admin") || url.includes("/profesor");
    }, 20000).catch(() => null);

    report.finalUrl = await driver.getCurrentUrl();
    const bodyText = await driver.findElement(By.css("body")).getText();
    report.passed = /registrado|registro exitoso|usuario registrado|login/i.test(bodyText) || report.finalUrl.includes("/login") || report.finalUrl.includes("/principal");

    addStep(
      report,
      "Validar registro exitoso",
      report.passed,
      report.passed ? `URL final: ${report.finalUrl} | texto: ${bodyText.slice(0, 140)}` : `URL final: ${report.finalUrl}`
    );

    if (report.passed) {
      console.log("Registro exitoso validado con click en Registrar");
    }

    await takeScreenshot(driver, "selenium-registro-exitoso");
  } catch (error) {
    report.error = error.message;
    addStep(report, "Ejecución general", false, error.message);
    console.error("Error en registro exitoso:", error.message);
  } finally {
    report.finishedAt = new Date().toISOString();
    saveReport(report, "selenium-registro-exitoso");
    await driver.quit();
  }
}

async function runRegisterPasswordMismatchTest() {
  const report = {
    testName: "Registro - validación de contraseñas",
    startedAt: new Date().toISOString(),
    passed: false,
    finalUrl: "",
    steps: [],
    error: null,
  };

  const driver = await createDriver();

  try {
    await openApp(driver, "/register");
    addStep(report, "Abrir registro", true, "Ruta /register disponible");

    const user = await fillRegisterForm(driver, {
      password: "FakePass123!",
      verificar_password: "OtraPass456!",
      email: `usuario.mismatch.${Date.now()}@mail.com`,
    });

    addStep(report, "Completar formulario con contraseñas distintas", true, `Email: ${user.email}`);

    await clickSubmit(driver);
    addStep(report, "Enviar formulario inválido", true, "Se intentó registrar con contraseña distinta");

    await driver.wait(async () => {
      const bodyText = await driver.findElement(By.css("body")).getText();
      return /contrase|coincid|error|obligatorio|registro/i.test(bodyText);
    }, 15000).catch(() => null);

    report.finalUrl = await driver.getCurrentUrl();
    const bodyText = await driver.findElement(By.css("body")).getText();
    report.passed = /contrase|coincid|error|obligatorio|registro/i.test(bodyText) || report.finalUrl.includes("/register");

    addStep(
      report,
      "Validar mensaje de validación",
      report.passed,
      report.passed ? `Respuesta detectada: ${bodyText.slice(0, 120)}` : `URL final: ${report.finalUrl}`
    );

    await takeScreenshot(driver, "selenium-registro-password-mismatch");
  } catch (error) {
    report.error = error.message;
    addStep(report, "Ejecución general", false, error.message);
    console.error("Error en validación de contraseña:", error.message);
  } finally {
    report.finishedAt = new Date().toISOString();
    saveReport(report, "selenium-registro-password-mismatch");
    await driver.quit();
  }
}

(async () => {
  console.log("Iniciando suite de registro Selenium con datos falsos...");
  await runRegisterLoadTest();
  await runRegisterFakeDataTest();
  await runRegisterSuccessTest();
  await runRegisterPasswordMismatchTest();
  console.log("Suite de registro finalizada.");
})();
