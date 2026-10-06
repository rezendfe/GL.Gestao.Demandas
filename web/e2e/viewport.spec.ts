import { expect, test, type Page } from "@playwright/test";

const contas: Record<string, string> = {
  "Cessionário": "joao.silva@empresaexemplo.com.br",
  "GL / Administrador": "patricia.lima@gleventos.com.br",
  "Responsável da Área": "responsavel.01@gleventos.com.br",
};

const rotas: Record<string, string[]> = {
  "Cessionário": ["/inicio", "/meu-espaco", "/minhas", "/comunicados", "/abrir"],
  "GL / Administrador": [
    "/inicio",
    "/central",
    "/central?visao=quadro",
    "/central?visao=operacao",
    "/central?visao=agenda",
    "/comunicados",
    "/cadeia",
    "/cadastros",
    "/espacos",
    "/empresas-cessionarias",
    "/obras",
    "/auditoria",
  ],
  "Responsável da Área": ["/inicio", "/central", "/central?visao=agenda"],
};

async function entrar(page: Page, perfil: string) {
  await page.goto("/login");
  await page.evaluate(() => sessionStorage.clear());
  await page.goto("/login");
  await page.locator("#login-pessoa").selectOption(contas[perfil]);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/inicio");
}

async function medida(page: Page) {
  return page.evaluate(() => {
    const largura = document.documentElement.clientWidth;
    const pagina = document.documentElement.scrollWidth - largura;
    const raiz = document.querySelector(".page-content") ?? document.body;
    const cortes: string[] = [];
    for (const el of raiz.querySelectorAll("*")) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) continue;
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
      if (rect.right <= largura + 1 && rect.left >= -1) continue;
      const classe = typeof el.className === "string" ? el.className.split(" ").filter(Boolean)[0] : el.tagName;
      cortes.push(`${el.tagName.toLowerCase()}.${classe ?? "sem"}:${Math.round(rect.right)}`);
      if (cortes.length >= 6) break;
    }
    const miudos: string[] = [];
    for (const el of document.querySelectorAll(".x-user button.x-caixa, .x-user button.x-audit, .x-user button.x-sino, .ditado-mic")) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      if (rect.width < 44 || rect.height < 44) {
        miudos.push(`${el.getAttribute("aria-label") ?? el.className}:${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
    }
    const folga = parseFloat(getComputedStyle(document.querySelector(".page-content-wrap") ?? document.body).paddingBottom);
    return { pagina, cortes, miudos, folga };
  });
}

test.describe("portal em 360px e em 1440px", () => {
  for (const perfil of Object.keys(rotas)) {
    test(`${perfil} usa a largura da tela`, async ({ page }) => {
      const celular = page.viewportSize()!.width <= 900;
      await entrar(page, perfil);
      for (const rota of rotas[perfil]) {
        await page.goto(rota);
        await page.locator(".page-content").waitFor();
        const resultado = await medida(page);
        expect(resultado.pagina, rota).toBeLessThanOrEqual(1);
        if (!celular) continue;
        expect(resultado.cortes, rota).toEqual([]);
        expect(resultado.miudos, rota).toEqual([]);
        expect(resultado.folga, rota).toBeGreaterThanOrEqual(72);
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
