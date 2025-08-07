"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var firestore_1 = require("firebase/firestore");
var mock_data_1 = require("../src/lib/mock-data");
var firebase_1 = require("../src/lib/firebase");
function migrateData() {
    return __awaiter(this, void 0, void 0, function () {
        var app, db, _i, mockUsers_1, user, _a, mockTeams_1, team, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 9, , 10]);
                    app = (0, firebase_1.getFirebaseAppForTenant)('default');
                    db = (0, firestore_1.getFirestore)(app);
                    console.log("Starting data migration to Firestore...");
                    // Migrate mockUsers to 'users' collection
                    console.log("Migrating users...");
                    _i = 0, mockUsers_1 = mock_data_1.mockUsers;
                    _b.label = 1;
                case 1:
                    if (!(_i < mockUsers_1.length)) return [3 /*break*/, 4];
                    user = mockUsers_1[_i];
                    // Using addDoc to let Firestore generate document IDs
                    return [4 /*yield*/, (0, firestore_1.addDoc)((0, firestore_1.collection)(db, "users"), user)];
                case 2:
                    // Using addDoc to let Firestore generate document IDs
                    _b.sent();
                    console.log("Added user: ".concat(user.displayName));
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("User migration complete.");
                    // Migrate mockTeams to 'teams' collection
                    console.log("Migrating teams...");
                    _a = 0, mockTeams_1 = mock_data_1.mockTeams;
                    _b.label = 5;
                case 5:
                    if (!(_a < mockTeams_1.length)) return [3 /*break*/, 8];
                    team = mockTeams_1[_a];
                    // Using addDoc to let Firestore generate document IDs
                    return [4 /*yield*/, (0, firestore_1.addDoc)((0, firestore_1.collection)(db, "teams"), team)];
                case 6:
                    // Using addDoc to let Firestore generate document IDs
                    _b.sent();
                    console.log("Added team: ".concat(team.name));
                    _b.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 5];
                case 8:
                    console.log("Team migration complete.");
                    return [3 /*break*/, 10];
                case 9:
                    error_1 = _b.sent();
                    console.error("Error during data migration:", error_1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
migrateData();
