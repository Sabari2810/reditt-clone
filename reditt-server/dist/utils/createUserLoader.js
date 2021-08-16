"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserLoader = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
const User_1 = require("../entities/User");
const createUserLoader = () => new dataloader_1.default(async (userIds) => {
    const users = await User_1.User.findByIds(userIds);
    const usermap = {};
    users.forEach((u) => {
        usermap[u.id] = u;
    });
    return userIds.map((id) => usermap[id]);
});
exports.createUserLoader = createUserLoader;
//# sourceMappingURL=createUserLoader.js.map