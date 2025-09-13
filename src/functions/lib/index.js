"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarWebhook = exports.handleSendInvitation = exports.handleNewUserCreated = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// Initialize the Firebase Admin SDK
firebase_admin_1.default.initializeApp();
// Export functions from their individual files
var user_management_js_1 = require("./user-management.js");
Object.defineProperty(exports, "handleNewUserCreated", { enumerable: true, get: function () { return user_management_js_1.handleNewUserCreated; } });
var send_invitation_js_1 = require("./send-invitation.js");
Object.defineProperty(exports, "handleSendInvitation", { enumerable: true, get: function () { return send_invitation_js_1.handleSendInvitation; } });
var calendar_webhook_js_1 = require("./calendar-webhook.js");
Object.defineProperty(exports, "calendarWebhook", { enumerable: true, get: function () { return calendar_webhook_js_1.calendarWebhook; } });
//# sourceMappingURL=index.js.map