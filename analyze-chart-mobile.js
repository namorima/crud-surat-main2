const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });

  // Test Desktop View
  console.log('\n=== DESKTOP VIEW ANALYSIS ===\n');
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const desktopPage = await desktopContext.newPage();

  await desktopPage.goto('http://localhost:3000');
  await desktopPage.waitForTimeout(2000);

  // Login (you may need to adjust credentials)
  const loginButton = await desktopPage.locator('button:has-text("Login")').first();
  if (await loginButton.isVisible()) {
    console.log('Need to login first...');
    // Add login logic here if needed
  }

  // Navigate to Dashboard
  await desktopPage.goto('http://localhost:3000/dashboard');
  await desktopPage.waitForTimeout(3000);

  // Switch to Bayaran tab
  await desktopPage.locator('button:has-text("Bayaran")').first().click();
  await desktopPage.waitForTimeout(2000);

  // Click on Kategori tab
  await desktopPage.locator('button:has-text("Kategori")').click();
  await desktopPage.waitForTimeout(2000);

  // Get chart container dimensions
  const chartContainer = desktopPage.locator('.recharts-wrapper').first();
  const desktopChartBox = await chartContainer.boundingBox();

  console.log('Desktop Chart Container:');
  console.log('  Width:', desktopChartBox?.width);
  console.log('  Height:', desktopChartBox?.height);

  // Check if chart is visible
  const isDesktopChartVisible = await chartContainer.isVisible();
  console.log('  Visible:', isDesktopChartVisible);

  // Take screenshot
  await desktopPage.screenshot({
    path: 'chart-desktop.png',
    fullPage: true
  });
  console.log('  Screenshot saved: chart-desktop.png');

  await desktopContext.close();

  // Test Mobile View
  console.log('\n=== MOBILE VIEW ANALYSIS ===\n');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  const mobilePage = await mobileContext.newPage();

  // Navigate to Dashboard (assuming already logged in)
  await mobilePage.goto('http://localhost:3000/dashboard');
  await mobilePage.waitForTimeout(3000);

  // Switch to Bayaran tab
  await mobilePage.locator('button:has-text("Bayaran")').first().click();
  await mobilePage.waitForTimeout(2000);

  // Click on Kategori tab
  await mobilePage.locator('button:has-text("Kategori")').click();
  await mobilePage.waitForTimeout(2000);

  // Get chart container dimensions
  const mobileChartContainer = mobilePage.locator('.recharts-wrapper').first();
  const mobileChartBox = await mobileChartContainer.boundingBox();

  console.log('Mobile Chart Container:');
  console.log('  Width:', mobileChartBox?.width);
  console.log('  Height:', mobileChartBox?.height);

  // Check if chart is visible
  const isMobileChartVisible = await mobileChartContainer.isVisible();
  console.log('  Visible:', isMobileChartVisible);

  // Check viewport vs content
  const viewport = mobilePage.viewportSize();
  console.log('  Viewport Width:', viewport?.width);
  console.log('  Content overflows:', mobileChartBox ? mobileChartBox.width > viewport?.width : 'N/A');

  // Check ChartContainer element
  const chartContainerElement = mobilePage.locator('.recharts-responsive-container').first();
  const chartContainerBox = await chartContainerElement.boundingBox();
  console.log('\nChartContainer Element:');
  console.log('  Width:', chartContainerBox?.width);
  console.log('  Height:', chartContainerBox?.height);

  // Check if horizontal scroll is present
  const bodyScrollWidth = await mobilePage.evaluate(() => document.body.scrollWidth);
  const bodyClientWidth = await mobilePage.evaluate(() => document.body.clientWidth);
  console.log('\nScroll Detection:');
  console.log('  Body ScrollWidth:', bodyScrollWidth);
  console.log('  Body ClientWidth:', bodyClientWidth);
  console.log('  Has horizontal scroll:', bodyScrollWidth > bodyClientWidth);

  // Take screenshot
  await mobilePage.screenshot({
    path: 'chart-mobile.png',
    fullPage: true
  });
  console.log('\n  Screenshot saved: chart-mobile.png');

  // Get computed styles
  const chartStyles = await mobilePage.evaluate(() => {
    const chart = document.querySelector('.recharts-wrapper');
    if (chart) {
      const styles = window.getComputedStyle(chart);
      return {
        width: styles.width,
        height: styles.height,
        overflow: styles.overflow,
        position: styles.position
      };
    }
    return null;
  });

  console.log('\nChart Computed Styles:');
  console.log('  Width:', chartStyles?.width);
  console.log('  Height:', chartStyles?.height);
  console.log('  Overflow:', chartStyles?.overflow);
  console.log('  Position:', chartStyles?.position);

  await mobileContext.close();

  console.log('\n=== ANALYSIS COMPLETE ===\n');
  console.log('Check chart-desktop.png and chart-mobile.png for visual comparison');

  await browser.close();
})();