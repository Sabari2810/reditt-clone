"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = void 0;
const User_1 = require("../entities/User");
const type_graphql_1 = require("type-graphql");
const argon2_1 = require("argon2");
const const_1 = require("../const");
const UsernamePasswordInput_1 = require("../utils/UsernamePasswordInput");
const validateRegister_1 = require("../utils/validateRegister");
const sendMail_1 = require("../utils/sendMail");
const uuid_1 = require("uuid");
let FieldError = class FieldError {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], FieldError.prototype, "field", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], FieldError.prototype, "message", void 0);
FieldError = __decorate([
    type_graphql_1.ObjectType()
], FieldError);
let UserResponse = class UserResponse {
};
__decorate([
    type_graphql_1.Field(() => [FieldError], { nullable: true }),
    __metadata("design:type", Array)
], UserResponse.prototype, "errors", void 0);
__decorate([
    type_graphql_1.Field(() => User_1.User, { nullable: true }),
    __metadata("design:type", User_1.User)
], UserResponse.prototype, "user", void 0);
UserResponse = __decorate([
    type_graphql_1.ObjectType()
], UserResponse);
let UserResolver = class UserResolver {
    async changePassword(token, newpassword, { em, redis, req }) {
        if (newpassword.length <= 3) {
            return {
                errors: [
                    {
                        field: "newPassword",
                        message: "length should be greater than 3",
                    },
                ],
            };
        }
        const key = const_1.FORGOT_TOKEN_PREFIX + token;
        const userid = await redis.get(key);
        if (!userid) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "token expired",
                    },
                ],
            };
        }
        const user = await em.findOne(User_1.User, { id: parseFloat(userid) });
        if (!user) {
            return {
                errors: [
                    {
                        field: "newPassword",
                        message: "user doesn't exist",
                    },
                ],
            };
        }
        user.password = await argon2_1.hash(newpassword);
        em.persistAndFlush(user);
        redis.del(key);
        req.session.userID = user.id;
        return { user };
    }
    async Me({ req, em }) {
        console.log(req.session.userID);
        if (!req.session.userID) {
            return null;
        }
        const user = await em.findOne(User_1.User, { id: req.session.userID });
        console.log(user);
        return user;
    }
    async forgotPassword(email, { redis, em }) {
        const user = await em.findOne(User_1.User, { email: email });
        if (!user) {
            return true;
        }
        const token = uuid_1.v4();
        await redis.set(const_1.FORGOT_TOKEN_PREFIX + token, user.id, "ex", 1000 * 60 * 60 * 24 * 3);
        const body = `<a href="http://localhost:3000/change-password/${token}">Reset Password</a>`;
        await sendMail_1.sendMail(email, body);
        return true;
    }
    async register(options, { em, req }) {
        const errors = validateRegister_1.validateRegister(options);
        if (errors) {
            return {
                errors,
            };
        }
        const hashedPassword = await argon2_1.hash(options.password);
        let user;
        try {
            const res = await em
                .createQueryBuilder(User_1.User)
                .getKnexQuery()
                .insert({
                email: options.email,
                username: options.username,
                password: hashedPassword,
                created_at: new Date(),
                updated_at: new Date(),
            })
                .returning("*");
            user = res[0];
        }
        catch (err) {
            if (err.code == "23505") {
                return {
                    errors: [
                        {
                            field: "username",
                            message: "username already taken",
                        },
                    ],
                };
            }
        }
        req.session.userID = user.id;
        return { user };
    }
    async Login(usernameoremail, password, { em, req }) {
        const user = await em.findOne(User_1.User, usernameoremail.includes("@")
            ? { email: usernameoremail }
            : { username: usernameoremail });
        console.log(user);
        if (!user) {
            return {
                errors: [
                    {
                        field: "usernameoremail",
                        message: "username doesn't exist",
                    },
                ],
            };
        }
        const isValid = await argon2_1.verify(user.password, password);
        if (!isValid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Invalid Password",
                    },
                ],
            };
        }
        req.session.userID = user.id;
        return {
            user,
        };
    }
    Logout({ req, res }) {
        return new Promise((resolve) => req.session.destroy((err) => {
            res.clearCookie(const_1.COOKIE_NAME);
            if (err) {
                console.log(err);
                resolve(false);
            }
            resolve(true);
        }));
    }
};
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg("token")),
    __param(1, type_graphql_1.Arg("newpassword")),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changePassword", null);
__decorate([
    type_graphql_1.Query(() => User_1.User, { nullable: true }),
    __param(0, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "Me", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    __param(0, type_graphql_1.Arg("email")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "forgotPassword", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg("options")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UsernamePasswordInput_1.UsernamePasswordInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg("usernameoremail")),
    __param(1, type_graphql_1.Arg("password")),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "Login", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    __param(0, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "Logout", null);
UserResolver = __decorate([
    type_graphql_1.Resolver()
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=user.js.map