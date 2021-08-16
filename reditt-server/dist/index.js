"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_core_1 = require("apollo-server-core");
const apollo_server_express_1 = require("apollo-server-express");
const connect_redis_1 = __importDefault(require("connect-redis"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const ioredis_1 = __importDefault(require("ioredis"));
const path_1 = __importDefault(require("path"));
require("reflect-metadata");
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const const_1 = require("./const");
const Post_1 = require("./entities/Post");
const Updoot_1 = require("./entities/Updoot");
const User_1 = require("./entities/User");
const hello_1 = require("./resolvers/hello");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const createUpdootLoader_1 = require("./utils/createUpdootLoader");
const createUserLoader_1 = require("./utils/createUserLoader");
const main = async () => {
    const conn = await typeorm_1.createConnection({
        type: "postgres",
        database: "redittclone2",
        username: "postgres",
        password: "postgresql",
        synchronize: true,
        migrations: [path_1.default.join(__dirname, "./migrations/*")],
        logging: true,
        entities: [User_1.User, Post_1.Post, Updoot_1.Updoot],
    });
    await conn.runMigrations();
    const app = express_1.default();
    app.set("trust proxy", 1);
    const RedisStore = connect_redis_1.default(express_session_1.default);
    const redis = new ioredis_1.default();
    app.use(cors_1.default({
        origin: "http://localhost:3000",
        credentials: true
    }));
    app.use(express_session_1.default({
        name: const_1.COOKIE_NAME,
        store: new RedisStore({
            client: redis,
            disableTouch: true,
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        },
        saveUninitialized: false,
        secret: "gfsewrewfsdsre",
        resave: false,
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        plugins: [
            apollo_server_core_1.ApolloServerPluginLandingPageGraphQLPlayground()
        ],
        schema: await type_graphql_1.buildSchema({
            resolvers: [hello_1.HelloResolver, post_1.PostResolver, user_1.UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({
            req: req,
            res: res,
            redis: redis,
            userLoader: createUserLoader_1.createUserLoader(),
            updootLoader: createUpdootLoader_1.createUpdootLoader()
        }),
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({
        app,
        cors: false
    });
    app.listen({ port: 4000 }, () => {
        console.log("server started");
    });
};
main().catch((err) => {
    console.error(err);
});
//# sourceMappingURL=index.js.map