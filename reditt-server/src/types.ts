import { Connection, IDatabaseDriver } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/core/EntityManager";
import { Request, Response } from "express";
import { Session, SessionData } from "express-session";
import { Redis } from "ioredis";

export type MyContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
  req: Request & {session : Session & Partial<SessionData> & {userID? : number}};
  res: Response;
  redis : Redis
};
