import { test, expect, Page } from '@playwright/test';

/**
 * Functional flow test for the Users screen: data loads -> grid renders,
 * with no extra interaction required.
 *
 * Regression context: the grid used to stay invisible (0 height) until the
 * user clicked an unrelated button ("Nuevo usuario"). Root cause was a dead
 * CSS selector (`.content > router-outlet + *` inside a component
 * stylesheet, silently defeated by Angular's view encapsulation scoping —
 * see the comment in src/styles.css) that was supposed to give the routed
 * page a real height. Without it, `app-page-layout`'s height: 100% chain
 * collapsed to the pane-header's own content height, leaving the grid 0px
 * tall; opening the modal only "fixed" it as a side effect of CSS Grid's
 * row auto-sizing (the taller form content stretched the shared row, and
 * the grid column along with it) — not an actual fix.
 */
async function signInAsFakeUser(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'e2e-fake-token');
    localStorage.setItem(
      'auth_user',
      JSON.stringify({ token: 'e2e-fake-token', email: 'e2e@test.local', fullName: 'E2E Test' }),
    );
  });
}

function mockJson(page: Page, resource: string, data: unknown): Promise<void> {
  return page.route(`**/api/v1/${resource}**`, (route) => {
    if (route.request().method() !== 'GET') {
      return route.continue();
    }
    return route.fulfill({ json: { statusCode: 200, success: true, message: null, data } });
  });
}

const sampleUsers = [
  { id: '1', email: 'ana@test.com', firstName: 'Ana', lastName: 'Gomez', isActive: true },
  { id: '2', email: 'luis@test.com', firstName: 'Luis', lastName: 'Perez', isActive: true },
];

test.describe('Users screen — data-load flow', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsFakeUser(page);
    await mockJson(page, 'modules/menu', []);
    await mockJson(page, 'roles', []);
  });

  test('renders the grid with rows as soon as the data loads, with no interaction', async ({
    page,
  }) => {
    await mockJson(page, 'users', sampleUsers);

    await page.goto('/users');

    // No clicks, no manual resize — just wait for the data-driven state.
    await expect(page.locator('.grid-total')).toHaveText('Total: 2 usuarios');
    await expect(page.locator('app-grid')).toBeVisible();
    await expect(page.locator('.ag-center-cols-container .ag-row')).toHaveCount(2);

    // Regression guard: the grid used to report a real row count in the DOM
    // while still being visually collapsed to 0 height.
    const box = (await page.locator('app-grid').boundingBox())!;
    expect(box.height).toBeGreaterThan(200);
  });

  test('shows the empty state (not a collapsed grid) when there are no users', async ({ page }) => {
    await mockJson(page, 'users', []);

    await page.goto('/users');

    await expect(page.locator('.grid-total')).toHaveText('Total: 0 usuarios');
    await expect(page.locator('.users-empty')).toBeVisible();
    await expect(page.locator('app-grid')).toHaveCount(0);
  });

  test('new user form opens inline next to an already-visible grid', async ({ page }) => {
    await mockJson(page, 'users', sampleUsers);

    await page.goto('/users');
    await expect(page.locator('app-grid')).toBeVisible();

    await page.getByRole('button', { name: 'Nuevo usuario' }).click();

    const dialog = page.locator('.modal-dialog-inline');
    await expect(dialog).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();

    // The grid must still be visible and unaffected once the panel opens.
    await expect(page.locator('app-grid')).toBeVisible();
    const gridBox = (await page.locator('app-grid').boundingBox())!;
    expect(gridBox.height).toBeGreaterThan(200);
  });
});
