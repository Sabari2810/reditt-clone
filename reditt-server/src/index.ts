import { MikroORM } from "@mikro-orm/core";
import { COOKIE_NAME, _prod_ } from "./const";
import mikroOrmConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import {
  ApolloServerPluginLandingPageGraphQLPlayground
} from "apollo-server-core";

// import redis from "redis";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import cors from 'cors';       

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

  const app = express();

  app.set("trust proxy", 1);

  const RedisStore = connectRedis(session);
  const redis = new Redis()

  // redisClient.on("error", (err) => {
  //   console.log("Redis error: ", err);
  // });

  app.use(cors({
    origin :"http://localhost:3000",
    credentials : true
  }));

  app.use(
    session({
      name: COOKIE_NAME,
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
    })
  );

  const apolloServer = new ApolloServer({
    plugins : [
      ApolloServerPluginLandingPageGraphQLPlayground()
    ],
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) : MyContext => ({
      em: orm.em,
      req: req,
      res: res,
      redis:redis
    }),
  });

  await apolloServer.start();
  
  apolloServer.applyMiddleware({
    app,
    cors : false
  });
 
  app.listen({port : 4000}, () => {
    console.log("server started");
  });

};

main().catch((err) => {
  console.error(err);
});
