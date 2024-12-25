"use strict";
import {
    authenticateUser,
    saveCurrentPage,
    getPageInfo,
    logoutUser,
    showError,
    showSuccess,
} from "./messages";
import { getDatabaseId, getUserAccessToken } from "./utils";
import axios from "axios";

const ROOT_URL = "http://localhost:3000/api/v1";
const clientId = "14dd872b-594c-80ab-b263-00373bb8656a";
const redirectUrl = "https://inspisave.netlify.app/";
const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${redirectUrl}`;

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === authenticateUser) {
        chrome.tabs.create({ url: notionAuthUrl }, (tab) => {
            chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
                const currentTabUrl = changeInfo.url;
                if (currentTabUrl && currentTabUrl.startsWith(redirectUrl)) {
                    const params = new URL(currentTabUrl).searchParams;
                    const authCode = params.get("code");
                    if (!authCode) {
                        return;
                    }

                    try {
                        const response = await axios({
                            method: "post",
                            url: `${ROOT_URL}/authenticate`,
                            data: { authCode },
                        });

                        if (!response.data.data.access_token) {
                            return;
                        }

                        chrome.storage.sync.set({
                            notionAccessToken: response.data.data.access_token,
                            databaseId: response.data.data.database_id,
                        });
                    } catch (error) {
                        console.log(
                            "Notion authentication failed, please make sure you allowed required permission"
                        );
                    }
                }
            });
        });
    }

    if (message.action === saveCurrentPage) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTabId = tabs[0].id;
            chrome.tabs.sendMessage(
                currentTabId,
                {
                    action: getPageInfo,
                },
                {},
                (response) => {
                    if (response) {
                        if (response.error) {
                            chrome.runtime.sendMessage({
                                action: showError,
                                message: response.error.message,
                            });
                            return;
                        }

                        try {
                            chrome.tabs.captureVisibleTab(
                                null,
                                { format: "png" },
                                (dataUrl) => {
                                    const pageInfo = {
                                        ssBase64Url: dataUrl,
                                        pageTitle: response.pageTitle,
                                        pageUrl: response.pageUrl,
                                    };
                                    sendPageInfoToNotion(pageInfo);
                                }
                            );
                        } catch (error) {
                            chrome.runtime.sendMessage({
                                action: showError,
                                message:
                                    "Sorry, we can't build the screenshot of this page",
                            });
                        }
                    } else {
                        chrome.runtime.sendMessage({
                            action: showError,
                            message:
                                "Sorry, Something unexpected happen at background, please open issue at ${githubLink}",
                        });
                    }
                }
            );
        });
    }

    if (message.action === logoutUser) {
        chrome.storage.sync.clear();
    }
});

async function sendPageInfoToNotion(pageInfo) {
    const userAccessToken = await getUserAccessToken();
    if (!userAccessToken) {
        throw new Error("Notion Access Token not found");
    }
    const databaseId = await getDatabaseId();
    if (!databaseId) {
        throw new Error("Databse ID not found");
    }

    const { ssBase64Url, pageTitle, pageUrl } = pageInfo;

    const formData = new FormData();
    formData.append("databaseId", databaseId);
    formData.append("screenShotImage", ssBase64Url);
    formData.append("pageTitle", pageTitle);
    formData.append("pageUrl", pageUrl);

    try {
        const response = await axios({
            method: "post",
            url: `${ROOT_URL}/save-page-to-notion`,
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${userAccessToken}`,
            },
            data: formData,
        });

        if (response.status === 201) {
            chrome.runtime.sendMessage({
                action: showSuccess,
                message: "Page saved succesfully to your Notion🎉",
            });
        }
    } catch (error) {
        chrome.runtime.sendMessage({
            action: showError,
            message: "Something went wrong from notion side",
        });
    }
}
