"use strict";

let FacebookAdsApi = null;
try {
  ({ FacebookAdsApi } = require("facebook-nodejs-business-sdk"));
} catch {
  FacebookAdsApi = null;
}
const config = require("./config");

const api = FacebookAdsApi ? new FacebookAdsApi(config.accessToken) : null;

module.exports = class GraphApi {
  static async #makeApiCall(messageId, senderPhoneNumberId, requestBody) {
    try {
      if (!api) {
        const simulated = { messages: [{ id: `mock_${Date.now()}` }], requestBody };
        console.log("Mock Graph API send:", JSON.stringify(simulated));
        return simulated;
      }

      if (messageId) {
        await api.call("POST", [`${senderPhoneNumberId}`, "messages"], {
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
        });
      }

      return await api.call("POST", [`${senderPhoneNumberId}`, "messages"], requestBody);
    } catch (error) {
      console.error("Error making API call:", error?.message || error);
      throw error;
    }
  }

  static async messageText(messageId, senderPhoneNumberId, recipientPhoneNumber, body, previewUrl = false) {
    return this.#makeApiCall(messageId, senderPhoneNumberId, {
      messaging_product: "whatsapp",
      to: recipientPhoneNumber,
      type: "text",
      text: { preview_url: Boolean(previewUrl), body },
    });
  }

  static async messageTemplate(messageId, senderPhoneNumberId, recipientPhoneNumber, templateName, locale, bodyParameters = []) {
    return this.#makeApiCall(messageId, senderPhoneNumberId, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientPhoneNumber,
      type: "template",
      template: {
        name: templateName,
        language: { code: locale },
        components: bodyParameters.length
          ? [{ type: "body", parameters: bodyParameters.map((text) => ({ type: "text", text })) }]
          : undefined,
      },
    });
  }
};
