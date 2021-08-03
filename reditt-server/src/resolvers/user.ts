import { User } from "../entities/User";
import { MyContext } from "../types";
import {
  Resolver,
  Mutation,
  Arg,
  Field,
  Ctx,
  ObjectType,
  Query,
} from "type-graphql";
import { hash, verify } from "argon2";
import { EntityManager } from "@mikro-orm/postgresql";
import { COOKIE_NAME, FORGOT_TOKEN_PREFIX } from "../const";
import { UsernamePasswordInput } from "../utils/UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendMail } from "../utils/sendMail";
import { v4 } from "uuid";

@ObjectType()
class FieldError {
  @Field()
  field?: String;

  @Field()
  message?: String;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newpassword") newpassword: string,
    @Ctx() { em, redis ,req}: MyContext
  ):Promise<UserResponse> {
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

    const key =  FORGOT_TOKEN_PREFIX + token;

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

    const user = await em.findOne(User, { id: parseFloat(userid) });

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

    user.password = await hash(newpassword);
    em.persistAndFlush(user);

    redis.del(key);

    req.session.userID = user.id

    return { user };
  }

  @Query(() => User, { nullable: true })
  async Me(@Ctx() { req, em }: MyContext) {
    console.log(req.session.userID);
    if (!req.session.userID) {
      return null;
    }
    const user = await em.findOne(User, { id: req.session.userID });
    console.log(user);
    return user;
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis, em }: MyContext
  ) {
    const user = await em.findOne(User, { email: email });
    if (!user) {
      return true;
    }
    const token = v4();

    await redis.set(
      FORGOT_TOKEN_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24 * 3
    );

    const body = `<a href="http://localhost:3000/change-password/${token}">Reset Password</a>`;
    await sendMail(email, body);

    return true;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return {
        errors,
      };
    }

    const hashedPassword = await hash(options.password);

    let user;
    try {
      const res = await (em as EntityManager)
        .createQueryBuilder(User)
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
    } catch (err) {
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

  @Mutation(() => UserResponse)
  async Login(
    @Arg("usernameoremail") usernameoremail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(
      User,
      usernameoremail.includes("@")
        ? { email: usernameoremail }
        : { username: usernameoremail }
    );
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

    const isValid = await verify(user.password, password);
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

  @Mutation(() => Boolean)
  Logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
        }

        resolve(true);
      })
    );
  }
}
