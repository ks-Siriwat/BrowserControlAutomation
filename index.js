import { chromium } from "playwright";
import Timemint from "./Timemint.js";
import Mdaemon from "./Mdaemon.js";
import Utils from "./utils.js";

(async () => {
    const browser = await chromium.launch({ headless: false });
    try {
        // open chromium
        const context = await browser.newContext();

        const timemintPage = await context.newPage();
        const mdaemonPage = await context.newPage();

        const loggedIn = await Timemint.isTimemintLoggedIn(timemintPage);
        if (!loggedIn) {
            await Promise.all([
                Timemint.loginTimemint(timemintPage),
                Mdaemon.loginMail(mdaemonPage)
            ]);
            const otp = await Mdaemon.getLatestOtpMail(mdaemonPage);
            console.log('✅ receive otp', otp)
            await Timemint.submitTimemintOtp(timemintPage, otp);
        }
        // now both Timemint and Mdaemon is Logged in

        // ... this should while loop checking new mail (loop forever);
        while (true) {
            // get request new location mails
            let newLocationRequests = await Mdaemon.getRequestAddingLocations(mdaemonPage);
            // Sample data -> [{ LocationName: "N.570 GPS", Lat: "10.1234", Long: "9.8765" }];
            // Sample data -> [{ From: "N.570", To: "N.888" }]

            for (const request of newLocationRequests) {
                const extracted = Utils.extractRequest(request);
                if ("Lat" in request && "Long" in request) {
                    // 🗺️ Type 1: GPS-based location request
                    await Timemint.handleNewLocation(timemintPage, request);
                } else if ("From" in request && "To" in request) {
                    // 🔄 Type 2: Transfer/move request
                    await Timemint.handleTransferRequest(timemintPage, request);
                } else {
                    console.warn("⚠️ Unknown request type:", request);
                }
            }

            // Avoid hammering the server; wait before next check
            await Timemint.pingTimemint(timemintPage);
            await new Promise(resolve => setTimeout(resolve, 20000)); // check every 20 seconds
        }
    } catch (error) {
        console.error(`!!! ${error}`);
        await browser.close();
    }
})();