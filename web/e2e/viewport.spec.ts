import { expect, test, type Page } from "@playwright/test";

const rotas: Record<string, string[]> = {
  "Cessionário": ["/inicio", "/meu-espaco", "/minhas", "/abrir"],
  "GL / Administrador": ["/inicio", "/quadro", "/cadeia", "/operacao", "/central", "/espacos", "/empresas-cessionarias", "/obras"],
  "Responsável da Área": ["/inicio", "/quadro", "/operacao", "/central"],
};

async function entrar(page: Page, perfil: string) {
  await page.goto("/login");
  await page.evaluate(() => sessionStorage.clear());
  await page.goto("/login");
  await page.getByRole("button", { name: perfil }).click();
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/inicio");
}

async function estouro(page: Page) {
  return page.evaluate(() => {
    const largura = document.documentElement.clientWidth;
    const pagina = document.documentElement.scrollWidth - largura;
    const internos: string[] = [];
    for (const el of document.querySelectorAll(".page-content, .kanban, .fluxo-trilho, .crm-chat, .fila-periodo, .x-bar, .fila-vista")) {
      if (el.scrollWidth > el.clientWidth + 4) {
        internos.push(`${String(el.className).split(" ")[0]}:${el.scrollWidth - el.clientWidth}`);
      }
    }
    return { pagina, internos };
  });
}

test.describe("portal em 360px e em 1440px", () => {
  for (const perfil of Object.keys(rotas)) {
    test(`${perfil} usa a largura da tela`, async ({ page }) => {
      await entrar(page, perfil);
      for (const rota of rotas[perfil]) {
        await page.goto(rota);
        const medida = await estouro(page);
        expect(medida.pagina, rota).toBeLessThanOrEqual(1);
        expect(medida.internos, rota).toEqual([]);
      }
    });
  }

  test("menu do celular abre, fecha e não fica no foco", async ({ page }) => {
    test.skip(page.viewportSize()!.width > 900, "só no celular");
    await entrar(page, "Cessionário");
    await expect(page.locator(".page-sidebar")).toHaveAttribute("inert", "");
    await page.getByRole("button", { name: "Alternar menu" }).click();
    await expect(page.locator(".page-sidebar")).not.toHaveAttribute("inert", "");
    await expect(page.getByRole("link", { name: "Minhas solicitações" })).toBeVisible();
    const altura = await page.locator(".page-sidebar nav a").first().evaluate((el) => el.getBoundingClientRect().height);
    expect(altura).toBeGreaterThanOrEqual(44);
    await page.keyboard.press("Escape");
    await expect(page.locator(".page-sidebar")).toHaveAttribute("inert", "");
  });

  test("computador mantém barra, quadro e cadeia lado a lado", async ({ page }) => {
    test.skip(page.viewportSize()!.width < 1200, "só no computador");
    await entrar(page, "GL / Administrador");
    const barra = await page.locator(".page-sidebar").evaluate((el) => el.getBoundingClientRect().left);
    expect(barra).toBeGreaterThanOrEqual(0);
    await expect(page.locator(".page-sidebar")).not.toHaveAttribute("inert", "");
    await page.goto("/quadro");
    await expect.poll(() => page.locator(".kanban").evaluate((el) => getComputedStyle(el).display)).toBe("flex");
    await page.goto("/cadeia");
    await expect.poll(() => page.locator(".fluxo-trilho").evaluate((el) => getComputedStyle(el).display)).toBe("flex");
    await page.goto("/central");
    await expect.poll(() => page.locator(".vista-grade table").evaluate((el) => getComputedStyle(el).display)).toBe("table");
  });

  test("no celular a grade vira cartões", async ({ page }) => {
    test.skip(page.viewportSize()!.width > 900, "só no celular");
    await entrar(page, "GL / Administrador");
    await page.goto("/central");
    await expect.poll(() => page.locator(".vista-grade table").evaluate((el) => getComputedStyle(el).display)).toBe("none");
    await expect.poll(() => page.locator(".vista-grade .cards").evaluate((el) => getComputedStyle(el).display)).toBe("grid");
  });
});
