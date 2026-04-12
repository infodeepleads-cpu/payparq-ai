import { expect, test, type Page } from '@playwright/test'

const superAdminEmail = process.env.PLAYWRIGHT_SUPERADMIN_EMAIL
const superAdminPassword = process.env.PLAYWRIGHT_SUPERADMIN_PASSWORD
const secondUserEmail = process.env.PLAYWRIGHT_SECOND_USER_EMAIL
const secondUserPassword = process.env.PLAYWRIGHT_SECOND_USER_PASSWORD

test.describe.configure({ mode: 'serial' })

test.beforeEach(async ({ page }) => {
  test.skip(
    !superAdminEmail || !superAdminPassword,
    'PLAYWRIGHT_SUPERADMIN_EMAIL and PLAYWRIGHT_SUPERADMIN_PASSWORD are required',
  )
  await page.goto('/')
  await waitForAuthScreen(page)
})

async function login(page: Page, email: string, password: string) {
  await waitForAuthScreen(page)
  const emailField = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i))
  const passwordField = page
    .getByLabel(/password/i)
    .or(page.getByPlaceholder(/password/i))
  await emailField.fill(email)
  await passwordField.fill(password)
  await page.getByText(/^Sign In$/).click()
  await waitForAuthenticatedShell(page)
  await expectNoLotsBanner(page)
}

async function logout(page: Page) {
  await page.getByText(/^Sign Out$/).click()
  await page.getByText(/^Sign Out$/).last().click()
  await waitForAuthScreen(page)
}

async function waitForAuthenticatedShell(page: Page) {
  await enableAccessibilityIfPresent(page)
  await expect(page.getByText(/^Sign Out$/).first()).toBeVisible()
}

async function waitForAuthScreen(page: Page) {
  await expect(page.getByText('payparq.ai')).toBeVisible()
  await enableAccessibilityIfPresent(page)
  const reloadButton = page.getByRole('button', { name: /^Reload$/ })
  if (await reloadButton.isVisible().catch(() => false)) {
    await reloadButton.click()
    await enableAccessibilityIfPresent(page)
  }
  await expect(page.getByText(/^Sign In$/)).toBeVisible({
    timeout: 180_000,
  })
  await expect(
    page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)),
  ).toBeVisible({
    timeout: 30_000,
  })
}

async function enableAccessibilityIfPresent(page: Page) {
  const accessibilityButton = page.getByRole('button', {
    name: /enable accessibility/i,
  })
  if (await accessibilityButton.isVisible().catch(() => false)) {
    await accessibilityButton.click()
  }
}

async function expectNoLotsBanner(page: Page) {
  await expect(page.getByText(/^No lots$/)).toHaveCount(0)
  await expect(page.getByText(/^Nema parkirališta$/)).toHaveCount(0)
}

test('super admin keeps visible lots across repeated logout and login', async ({
  page,
}) => {
  await login(page, superAdminEmail!, superAdminPassword!)
  await logout(page)
  await login(page, superAdminEmail!, superAdminPassword!)
  await logout(page)
  await login(page, superAdminEmail!, superAdminPassword!)
})

test('switching accounts does not leave the lot selector empty', async ({
  page,
}) => {
  test.skip(
    !secondUserEmail || !secondUserPassword,
    'PLAYWRIGHT_SECOND_USER_EMAIL and PLAYWRIGHT_SECOND_USER_PASSWORD are required for account-switch coverage',
  )
  await login(page, superAdminEmail!, superAdminPassword!)
  await logout(page)
  await login(page, secondUserEmail!, secondUserPassword!)
})
