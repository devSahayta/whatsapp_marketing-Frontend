// src/utils/googlePicker.js
//
// Opens the Google Picker so the user can choose a spreadsheet. Picking a file
// grants Samvaadik drive.file access to that one sheet — this is what lets us
// avoid the sensitive/restricted Drive scopes (and Google's "unverified app"
// warning).

import { fetchGooglePickerToken } from "../api/googleSheets";

const GAPI_SRC = "https://apis.google.com/js/api.js";

let pickerLibPromise = null;

const loadPickerLib = () => {
  if (window.google?.picker) return Promise.resolve();
  if (pickerLibPromise) return pickerLibPromise;

  pickerLibPromise = new Promise((resolve, reject) => {
    const onGapiReady = () =>
      window.gapi.load("picker", {
        callback: resolve,
        onerror: () => reject(new Error("Failed to load Google Picker")),
      });

    if (window.gapi?.load) {
      onGapiReady();
      return;
    }

    const script = document.createElement("script");
    script.src = GAPI_SRC;
    script.async = true;
    script.onload = onGapiReady;
    script.onerror = () => reject(new Error("Failed to load Google Picker"));
    document.body.appendChild(script);
  }).catch((err) => {
    pickerLibPromise = null; // allow retry
    throw err;
  });

  return pickerLibPromise;
};

/**
 * Opens the Google Sheets picker.
 * @param {{ fileId?: string }} [options] fileId pre-selects a specific sheet
 *   (used to re-grant access to a group's linked sheet).
 * @returns {Promise<{ id: string, name: string } | null>} null if cancelled.
 *   Rejects with the backend error (axios error) if Google isn't connected.
 */
export const pickGoogleSheet = async ({ fileId } = {}) => {
  const [{ data }] = await Promise.all([
    fetchGooglePickerToken(),
    loadPickerLib(),
  ]);

  const { picker } = window.google;

  const view = new picker.DocsView(picker.ViewId.SPREADSHEETS)
    .setIncludeFolders(false)
    .setSelectFolderEnabled(false)
    .setMode(picker.DocsViewMode.LIST);

  if (fileId && typeof view.setFileIds === "function") {
    view.setFileIds(fileId);
  }

  return new Promise((resolve) => {
    const builder = new picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(data.accessToken)
      .setDeveloperKey(data.apiKey)
      .setAppId(data.appId)
      .setTitle("Select a Google Sheet")
      .setOrigin(window.location.origin)
      .setCallback((result) => {
        const action = result[picker.Response.ACTION];
        if (action === picker.Action.PICKED) {
          const doc = result[picker.Response.DOCUMENTS]?.[0];
          resolve(
            doc
              ? { id: doc[picker.Document.ID], name: doc[picker.Document.NAME] }
              : null,
          );
        } else if (action === picker.Action.CANCEL) {
          resolve(null);
        }
      });

    builder.build().setVisible(true);
  });
};
