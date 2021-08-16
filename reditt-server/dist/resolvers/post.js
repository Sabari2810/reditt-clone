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
exports.PostResolver = void 0;
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const Post_1 = require("../entities/Post");
const Updoot_1 = require("../entities/Updoot");
const User_1 = require("../entities/User");
const isAuth_1 = require("../Middleware/isAuth");
let PostInput = class PostInput {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], PostInput.prototype, "title", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], PostInput.prototype, "text", void 0);
PostInput = __decorate([
    type_graphql_1.InputType()
], PostInput);
let PaginatedPost = class PaginatedPost {
};
__decorate([
    type_graphql_1.Field(() => [Post_1.Post]),
    __metadata("design:type", Array)
], PaginatedPost.prototype, "posts", void 0);
__decorate([
    type_graphql_1.Field(() => Boolean),
    __metadata("design:type", Boolean)
], PaginatedPost.prototype, "hasMorePost", void 0);
PaginatedPost = __decorate([
    type_graphql_1.ObjectType()
], PaginatedPost);
let PostResolver = class PostResolver {
    textSnippet(root) {
        return root.text.slice(0, 70);
    }
    async creator(root, { userLoader }) {
        return await userLoader.load(root.creatorId);
    }
    async voteStatus(root, { updootLoader, req }) {
        const userId = req.session.userID;
        if (!userId) {
            return null;
        }
        const updoot = await updootLoader.load({ postId: root.id, userId: userId });
        return updoot ? updoot.value : null;
    }
    async vote(postId, value, { req }) {
        const userId = req.session.userID;
        const realValue = value;
        const updoot = await Updoot_1.Updoot.findOne({ where: { postId, userId } });
        if (updoot && updoot.value !== realValue) {
            console.log("changing my vote");
            await typeorm_1.getConnection().transaction(async (tm) => {
                tm.query(`
            update updoot u set value = $1 where u."postId" = $2 and u."userId" = $3
            `, [realValue, postId, userId]);
                tm.query(`
             update post set points = points + $1 where id = $2;
              `, [realValue, postId]);
            });
        }
        else if (!updoot) {
            console.log("voting a post");
            await typeorm_1.getConnection().transaction(async (tm) => {
                tm.query(`
            insert into updoot("userId","postId","value") values($1,$2,$3);
            `, [userId, postId, realValue]);
                tm.query(`
              update post set points = points + $1 where id = $2;
              `, [realValue, postId]);
            });
        }
        return true;
    }
    async Posts(limit, cursor, { req }) {
        const realLimit = Math.min(50, limit);
        const realLimitPlusOne = realLimit + 1;
        const userId = req.session.userID;
        const replacements = [realLimitPlusOne];
        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
        }
        const posts = await typeorm_1.getConnection().query(`
      select p.*
      from post p
      ${cursor ? 'where p."createdAt" < $2' : ""}
      order by p."createdAt" DESC
      Limit $1
    `, replacements);
        console.log("posts", posts);
        return {
            posts: posts.slice(0, realLimit),
            hasMorePost: posts.length === realLimitPlusOne,
        };
    }
    async Post(id) {
        return await Post_1.Post.findOne(id, { relations: ["creator"] });
    }
    async createPost(options, { req }) {
        return await Post_1.Post.create({
            ...options,
            creatorId: req.session.userID,
        }).save();
    }
    async updatePost(id, title, text, { req }) {
        const post = await Post_1.Post.findOne(id);
        const userId = req.session.userID;
        if (!post) {
            return null;
        }
        const updatedpost = await typeorm_1.getConnection()
            .createQueryBuilder()
            .update(Post_1.Post)
            .set({ title, text })
            .where('id = :id and post."creatorId" = :userId', { id, userId })
            .returning("*")
            .execute();
        return updatedpost.raw[0];
    }
    async deletePost(id, { req }) {
        await Updoot_1.Updoot.delete({ postId: id });
        await Post_1.Post.delete({ id, creatorId: req.session.userID });
        return true;
    }
};
__decorate([
    type_graphql_1.FieldResolver(() => String),
    __param(0, type_graphql_1.Root()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post]),
    __metadata("design:returntype", void 0)
], PostResolver.prototype, "textSnippet", null);
__decorate([
    type_graphql_1.FieldResolver(() => User_1.User),
    __param(0, type_graphql_1.Root()),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "creator", null);
__decorate([
    type_graphql_1.FieldResolver(() => Number, { nullable: true }),
    __param(0, type_graphql_1.Root()),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "voteStatus", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("postId", () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Arg("value", () => type_graphql_1.Int)),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "vote", null);
__decorate([
    type_graphql_1.Query(() => PaginatedPost),
    __param(0, type_graphql_1.Arg("limit", () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Arg("cursor", () => String, { nullable: true })),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "Posts", null);
__decorate([
    type_graphql_1.Query(() => Post_1.Post),
    __param(0, type_graphql_1.Arg("id", () => type_graphql_1.Int)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "Post", null);
__decorate([
    type_graphql_1.Mutation(() => Post_1.Post),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("options")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PostInput, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "createPost", null);
__decorate([
    type_graphql_1.Mutation(() => Post_1.Post, { nullable: true }),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("id", () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Arg("title", () => String, { nullable: true })),
    __param(2, type_graphql_1.Arg("text", () => String)),
    __param(3, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "updatePost", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("id", () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "deletePost", null);
PostResolver = __decorate([
    type_graphql_1.Resolver(Post_1.Post)
], PostResolver);
exports.PostResolver = PostResolver;
//# sourceMappingURL=post.js.map