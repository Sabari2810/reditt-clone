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
  FieldResolver,
  Root,
} from "type-graphql";
import { hash, verify } from "argon2";
import { COOKIE_NAME, FORGOT_TOKEN_PREFIX } from "../const";
import { UsernamePasswordInput } from "../utils/UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendMail } from "../utils/sendMail";
import { v4 } from "uuid";
import { getConnection } from "typeorm";

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

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user:User,@Ctx() {req} : MyContext){
    if(req.session.userID === user.id){
      return user.email;
    }

    return "";
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newpassword") newpassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
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

    const key = FORGOT_TOKEN_PREFIX + token;

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

    const userIdNum = parseFloat(userid);

    const user = await User.findOne(userIdNum);

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

    await User.update({ id: userIdNum }, { password: await hash(newpassword) });

    redis.del(key);

    req.session.userID = user.id;

    return { user };
  }

  @Query(() => User, { nullable: true })
  async Me(@Ctx() { req }: MyContext) {
    console.log(req.session.userID);
    if (!req.session.userID) {
      return null;
    }
    const user = await User.findOne(req.session.userID);
    console.log(user);
    return user;
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });
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
    @Ctx() { req }: MyContext
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
      const res = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          email: options.email,
          username: options.username,
          password: hashedPassword,
        })
        .returning("*")
        .execute();

      console.log(res);
      user = res.raw[0];
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
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameoremail.includes("@")
        ? { where :{email: usernameoremail }}
        : { where : { username: usernameoremail} }
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
