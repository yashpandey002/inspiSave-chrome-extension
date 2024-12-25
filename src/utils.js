async function getUserAccessToken() {
    const token = await new Promise((resolve, reject) => {
        chrome.storage.sync.get("notionAccessToken", (result) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(result.notionAccessToken);
        });
    });

    return token;
}

async function getDatabaseId() {
    const databaseId = await new Promise((resolve, reject) => {
        chrome.storage.sync.get("databaseId", (result) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(result.databaseId);
        });
    });

    return databaseId;
}

export { getUserAccessToken, getDatabaseId };
