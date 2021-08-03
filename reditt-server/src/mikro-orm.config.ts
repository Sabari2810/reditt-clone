import { MikroORM } from "@mikro-orm/core";
import { _prod_ } from "./const";
import { Post } from "./entities/Post";
import path from "path";
import { User } from "./entities/User";

export default {
  migrations: {
    path: path.join(__dirname,"./migrations"), // path to the folder with migrations
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  entities: [Post,User],
  dbName: "redditclone",
  password: "postgresql", 
  type: "postgresql",
  debug: !_prod_, 
} as Parameters<typeof MikroORM.init>[0];
