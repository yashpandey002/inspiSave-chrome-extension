"use strict";
import { getPageInfo } from "./messages";

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action == getPageInfo) {
        const pageTitle = document.title;
        const pageUrl = window.location.href;

        if (!pageTitle || !pageUrl) {
            sendResponse({
                error: {
                    message:
                        "Sorry, Something unexpected happen with this page, try again.",
                },
            });
        }

        sendResponse({ pageTitle, pageUrl });
    }
});
