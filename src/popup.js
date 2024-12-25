"use strict";
import css from "./popup.css";
import {
    authenticateUser,
    saveCurrentPage,
    logoutUser,
    showError,
    showSuccess,
} from "./messages";
import { getUserAccessToken } from "./utils";

document.addEventListener("DOMContentLoaded", async () => {
    const loginToNotionPage = document.getElementById("loginPage");
    const savePage = document.getElementById("savePage");
    const loginBtn = document.getElementById("login-btn");
    const savePageBtn = document.getElementById("save-page-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const contentArea = document.getElementById("content");
    const finalMessage = document.getElementById("final-message");
    const loadingImage = document.getElementById("loading");

    finalMessage.style.display = "none";
    loadingImage.style.display = "none";

    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === showError) {
            finalMessage.textContent = message.message;
            loadingImage.style.display = "none";
            finalMessage.style.color = "#333";
            finalMessage.style.display = "block";
        }

        if (message.action == showSuccess) {
            finalMessage.textContent = message.message;
            loadingImage.style.display = "none";
            finalMessage.style.color = "#42f560";
            finalMessage.style.display = "block";
        }
    });

    const userAccessToken = await getUserAccessToken();
    if (userAccessToken) {
        loginToNotionPage.style.display = "none";
        savePage.style.display = "block";
    } else {
        loginToNotionPage.style.display = "block";
        savePage.style.display = "none";
    }

    loginBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: authenticateUser });
    });

    savePageBtn.addEventListener("click", () => {
        contentArea.style.display = "none";
        loadingImage.style.display = "block";
        chrome.runtime.sendMessage({ action: saveCurrentPage });
    });

    logoutBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: logoutUser });
        window.close();
    });
});
