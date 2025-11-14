import dotenv from "dotenv";
dotenv.config();

export default {
    loginMail,
    getLatestOtpMail,
    getRequestAddingLocations
}

async function loginMail(page) {
    await page.goto("https://mail.nawarat.co.th/", { waitUntil: "domcontentloaded" });
    const isLoggedin = await isLoggedIn(page)
    if (!isLoggedin) {
        await fillCredentials(page);
        await page.click("#Logon");
    }
    await page.waitForTimeout(5000);
}

async function getLatestOtpMail(page) {
    await loginMail(page);

    const otpMails = page.locator('.tableRow.unread:has(.subject:has-text("รหัสยืนยันในการเข้าสู่ระบบให้สำเร็จ"))');

    const found = await waitForOtpMail(page, otpMails, 10);
    if (!found) throw new Error("❌ Time out for waiting OTP mail");

    await otpMails.first().click();
    const emailBody = await getEmailBody(page);

    return extractOtp(emailBody);
}

async function getRequestAddingLocations() {
    // should return these format
    // Sample data -> [{ LocationName: "N.570 GPS", Lat: "10.1234", Long: "9.8765" }];
    // Sample data -> [{ From: "N.570", To: "N.888" }]


}

/* --- helper functions --- */

async function isLoggedIn(page) {
    if (page.url().includes('Session=')) {
        console.log("✅ Already in mdaemon");
        return true;
    }
    return false;
}

async function fillCredentials(page) {
    const user = process.env.MDAEMON_USER;
    const password = process.env.MDAEMON_PASSWORD;

    if (!user || !password) {
        throw new Error("❌ Missing MDAEMON_USER or MDAEMON_PASSWORD in .env file");
    }

    await page.fill("#User", user);
    await page.fill("#Password", password);
}

async function waitForOtpMail(page, otpMails, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await otpMails.first().waitFor({ state: "visible", timeout: 15000 });
            return true;
        } catch {
            console.warn(`Retry ${i + 1}/${retries}: refreshing inbox...`);
            await page.reload();
            await page.waitForTimeout(5000);
        }
    }
    return false;
}

async function getEmailBody(page) {
    const frameElement = await page.$("#MsgBody");
    return await frameElement.contentFrame();

}

async function extractOtp(bodyFrame) {
    const mail = await bodyFrame.locator(".es-m-txt-c").nth(1).innerText();
    const otpMatch = mail.match(/\b\d{6}\b/);
    return otpMatch ? otpMatch[0] : null;
}

// -------------- GPS ----------------