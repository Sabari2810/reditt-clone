import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware
} from "type-graphql";
import { getConnection } from "typeorm";
import { Post } from "../entities/Post";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";
import { isAuth } from "../Middleware/isAuth";
import { MyContext } from "../types";

@InputType()
class PostInput {
  @Field()
  title!: string;

  @Field()
  text!: string;
}

@ObjectType()
class PaginatedPost {
  @Field(() => [Post])
  posts!: Post[];

  @Field(() => Boolean)
  hasMorePost!: Boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 70);
  }

  @FieldResolver(() => User)
  async creator(@Root() root: Post,@Ctx() {userLoader} : MyContext) {
    return await userLoader.load(root.creatorId);
  }

  @FieldResolver(() => Number,{nullable : true})
  async voteStatus(@Root() root: Post,@Ctx() {updootLoader,req} : MyContext){
    const userId = req.session.userID
    if(!userId){
      return null;
    }
    const updoot = await updootLoader.load({postId : root.id,userId : userId})
    return updoot ? updoot.value : null
  }


  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const userId = req.session.userID;
    const realValue = value;

    const updoot = await Updoot.findOne({ where: { postId, userId } });

    if (updoot && updoot.value !== realValue) {
      console.log("changing my vote");
      await getConnection().transaction(async (tm) => {
        tm.query(
          `
            update updoot u set value = $1 where u."postId" = $2 and u."userId" = $3
            `,
          [realValue, postId, userId]
        );

        tm.query(
          `
             update post set points = points + $1 where id = $2;
              `,
          [realValue, postId]
        );
      });
    } else if (!updoot) {
      console.log("voting a post");
      await getConnection().transaction(async (tm) => {
        tm.query(
          `
            insert into updoot("userId","postId","value") values($1,$2,$3);
            `,
          [userId, postId, realValue]
        );

        tm.query(
          `
              update post set points = points + $1 where id = $2;
              `,
          [realValue, postId]
        );
      });
    }

    return true;
  }

  @Query(() => PaginatedPost)
  async Posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPost> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;
    const userId = req.session.userID;

    const replacements: any[] = [realLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }

    const posts = await getConnection().query(
      `
      select p.*
      from post p
      ${cursor ? 'where p."createdAt" < $2' : ""}
      order by p."createdAt" DESC
      Limit $1
    `,
      replacements
    );

    console.log("posts", posts);

    // const qb = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("p")
    //   .orderBy('"createdAt"', "DESC")
    //   .take(realLimitPlusOne);

    // if (cursor) {
    //   qb.where('"createdAt" < :cursor', { cursor: new Date(parseInt(cursor))});
    // }

    // const posts = await qb.getMany();

    // return {
    //   posts: posts.slice(0, realLimit),
    //   hasMorePost: posts.length === realLimitPlusOne,
    // };
    return {
      posts: posts.slice(0, realLimit),
      hasMorePost: posts.length === realLimitPlusOne,
    };
  }

  @Query(() => Post)
  async Post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return await Post.findOne(id, { relations: ["creator"] });
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("options") options: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return await Post.create({
      ...options,
      creatorId: req.session.userID,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Arg("text", () => String) text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const post = await Post.findOne(id);
    const userId = req.session.userID;
    if (!post) {
      return null;
    }
    const updatedpost = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and post."creatorId" = :userId', { id, userId })
      .returning("*")
      .execute();

    return updatedpost.raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<Boolean> {
    await Updoot.delete({ postId: id });
    await Post.delete({ id, creatorId: req.session.userID });
    return true;
  }
}
