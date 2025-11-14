import dotenv from "dotenv";
dotenv.config();

export default {
    isTimemintLoggedIn,
    loginTimemint,
    submitTimemintOtp,
    pingTimemint
};

async function isTimemintLoggedIn(page) {
    await gotoDefaultPage(page);
    // 1️⃣ URL check
    if (page.url().includes("dashboard.php")) {
        console.log("✅ Already in Timemint/dashboard.php");
        return true;
    }

    // 2️⃣ Optional visible element check
    const banner = page.locator('text=ลงชื่อเข้าใช้สำเร็จแล้ว');
    if (await banner.isVisible().catch(() => false)) {
        console.log("✅ Already logged in to Timemint (banner found).");
        return true;
    }

    return false;
}

async function loginTimemint(page) {
    await gotoDefaultPage(page);

    console.log("🔹 Timemint Logging in...");
    await fillCredentials(page);
    await submitLogin(page);
}

async function submitTimemintOtp(page, otp) {
    await page.fill("#login-form-code", otp);
    await page.click('button[type="submit"]');
    console.log("✅ Timemint login complete!");
}

async function pingTimemint(page) {
    await page.request.get(
        'https://member.timemint.co/TMC_SS_ACTIVE.php',
        { params: { AC: 'CHECK' } }
    );
    // console.log('Keeping Timemint Alive...');
}

/* --- Helper functions --- */

async function gotoDefaultPage(page) {
    await page.goto("https://member.timemint.co/", { waitUntil: "domcontentloaded" });
}

async function fillCredentials(page) {
    const email = process.env.TIMEMINT_EMAIL;
    const password = process.env.TIMEMINT_PASSWORD;

    if (!email || !password) {
        throw new Error("❌ Missing TIMEMINT_EMAIL or TIMEMINT_PASSWORD in .env file");
    }

    await page.fill("#login-form-email", email);
    await page.fill("#login-form-password", password);
}

async function submitLogin(page) {
    await page.click('button[name="subbtn"]');
    await page.waitForSelector("#login-form-code", { timeout: 20000 });
    console.log("🔸 Waiting for OTP...");
}
