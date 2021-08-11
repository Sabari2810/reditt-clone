import { Request, Response } from "express";
import { Session, SessionData } from "express-session";
import { Redis } from "ioredis";

export type MyContext = {
  req: Request & {session : Session & Partial<SessionData> & {userID? : number}};
  res: Response;
  redis : Redis
};
