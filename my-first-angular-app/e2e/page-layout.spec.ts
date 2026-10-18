import { test, expect, Page } from '@playwright/test';

/**
 * Visual/geometry regression tests for the reusable `app-page-layout` +
 * `app-modal` split-screen pattern.
 *
 * `authGuard` only checks a token in localStorage (see
 * `core/auth/guards/auth.guard.ts`), so a fake token is enough to reach a
 * guarded route. But if a real backend happens to be running on
 * `environment.apiUrl`, it will reject that fake token with 401, and
 * `authInterceptor` treats any 401 as "session invalid": it wipes
 * localStorage and redirects back to /login mid-test — triggered even on
 * routes with no API calls of their own, since `SidebarComponent` (part of
 * the shared authenticated layout) always fetches `/modules/menu`. Every
 * GET this app makes under a guarded route is mocked below so the test
 * never depends on a live backend.
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

function mockEmptyApi(page: Page, ...resources: string[]): Promise<void> {
  return Promise.all(
    resources.map((resource) =>
      page.route(`**/api/v1/${resource}**`, (route) => {
        if (route.request().method() !== 'GET') {
          return route.continue();
        }
        return route.fulfill({
          json: { statusCode: 200, success: true, message: null, data: [] },
        });
      }),
    ),
  ).then(() => undefined);
}

test.describe('Users screen — split layout (grid + inline panel)', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsFakeUser(page);
    await mockEmptyApi(page, 'modules/menu', 'users', 'roles');
    await page.goto('/users');
    await expect(page.locator('section[layout-main].grid-pane')).toBeVisible();
  });

  test('grid pane and side panel each take their configured ~50% share', async ({ page }) => {
    const mainCell = page.locator('section[layout-main]');
    const sideCell = page.locator('section[layout-side]');
    const gridPane = page.locator('.grid-pane');

    const [mainBox, sideBox, gridBox] = await Promise.all([
      mainCell.boundingBox(),
      sideCell.boundingBox(),
      gridPane.boundingBox(),
    ]);

    expect(mainBox).not.toBeNull();
    expect(sideBox).not.toBeNull();
    expect(gridBox).not.toBeNull();

    const totalWidth = mainBox!.width + sideBox!.width;

    // Both cells within a few px of a true 50/50 split.
    expect(Math.abs(mainBox!.width - sideBox!.width)).toBeLessThan(40);

    // Regression guard: `.grid-pane` used to inherit a stray `max-width: 50%`
    // from the legacy `.workspace` split, halving it again inside the new
    // layout cell (~25% of the screen instead of ~50%).
    expect(gridBox!.width).toBeGreaterThan(totalWidth * 0.4);

    // Regression guard: the grid pane used to collapse to its content's
    // intrinsic height instead of filling the available vertical space.
    expect(gridBox!.height).toBeGreaterThan(mainBox!.height * 0.8);
  });

  test('opening the form renders it inline in the right column, not as a full-screen overlay', async ({
    page,
  }) => {
    const sideCell = page.locator('section[layout-side]');
    const sideBox = (await sideCell.boundingBox())!;

    await page.getByRole('button', { name: 'Nuevo usuario' }).click();

    const dialog = page.locator('.modal-dialog-inline');
    await expect(dialog).toBeVisible();
    const dialogBox = (await dialog.boundingBox())!;

    // Docked/floating modal variants ignore their DOM position and overlay
    // the full viewport (position: fixed; inset: 0). The inline variant must
    // instead stay inside its own layout-side column.
    expect(dialogBox.x).toBeGreaterThan(sideBox.x - 5);
    expect(dialogBox.width).toBeLessThan(sideBox.width + 5);

    const viewport = page.viewportSize()!;
    expect(dialogBox.width).toBeLessThan(viewport.width * 0.7);
  });
});

test.describe('Dashboard screen — left-stacked-right layout', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsFakeUser(page);
    await mockEmptyApi(page, 'modules/menu');
    await page.goto('/dashboard');
    await expect(page.locator('section[layout-side] app-grid').first()).toBeVisible();
  });

  test('left pane keeps its ~30/70 share and the two right-side grids stack without overlapping', async ({
    page,
  }) => {
    const mainCell = page.locator('section[layout-main]');
    const sideCell = page.locator('section[layout-side]');

    const [mainBox, sideBox] = await Promise.all([mainCell.boundingBox(), sideCell.boundingBox()]);

    expect(mainBox).not.toBeNull();
    expect(sideBox).not.toBeNull();

    const totalWidth = mainBox!.width + sideBox!.width;
    const leftShare = mainBox!.width / totalWidth;
    expect(leftShare).toBeGreaterThan(0.2);
    expect(leftShare).toBeLessThan(0.4);

    const grids = page.locator('section[layout-side] app-grid');
    await expect(grids).toHaveCount(2);

    const [firstBox, secondBox] = await Promise.all([
      grids.nth(0).boundingBox(),
      grids.nth(1).boundingBox(),
    ]);

    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();

    // Regression guard: when the split layout's generic fill rule leaked
    // into left-stacked-right mode, both stacked grids fought over the same
    // 100% height and overlapped instead of occupying their own row.
    expect(secondBox!.y).toBeGreaterThanOrEqual(firstBox!.y + firstBox!.height - 5);
    expect(firstBox!.height).toBeGreaterThan(50);
    expect(secondBox!.height).toBeGreaterThan(50);
  });
});
