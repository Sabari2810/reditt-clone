import { Cache, cacheExchange, Resolver } from "@urql/exchange-graphcache";
import router from "next/router";
import {
  dedupExchange,
  Exchange,
  fetchExchange,
  gql,
  stringifyVariables,
} from "urql";
import { pipe, tap } from "wonka";
import {
  DeletePostMutationVariables,
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
  VoteMutationVariables,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";
import { isServer } from "./isServer";

export const errorExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      forward(ops$),
      tap(({ error }) => {
        if (error?.message.includes("user not authenticated")) {
          router.replace("/login");
        }
      })
    );
  };

const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    const allFields = cache.inspectFields(entityKey);
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    const isItInTheCache = cache.resolve(entityKey, fieldKey);
    info.partial = !isItInTheCache;

    let hasMorePost = true;
    const posts: string[] = [];

    fieldInfos.forEach((fi) => {
      const res = cache.resolve(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(res, "posts") as string[];
      hasMorePost = cache.resolve(res, "hasMorePost") as boolean;
      posts.push(...data);
    });

    return { __typename: "PaginatedPost", hasMorePost, posts };
  };
};

const invalidatePost = (cache: Cache) => {
  const allFields = cache.inspectFields("Query");
  const fieldInfos = allFields.filter((info) => info.fieldName === "Posts");
  fieldInfos.forEach((fi) => {
    cache.invalidate("Query", "Posts", fi.arguments || {});
  });
};

export const createUrqlClient = (ssrExchange: any, Ctx: any) => {
  let cookie;
  if (isServer()) {
    cookie = Ctx.req.headers.cookie;
  }

  return {
    url: "http://localhost:4000/graphql",
    fetchOptions: {
      credentials: "include" as const,
      headers: cookie ? { cookie } : undefined,
    },
    exchanges: [
      dedupExchange,
      cacheExchange({
        keys: {
          PaginatedPost: () => null,
        },
        resolvers: {
          Query: {
            Posts: cursorPagination(),
          },
        },
        updates: {
          Mutation: {
            deletePost: (_result, args, cache, info) => {
              cache.invalidate({
                __typename: "Post",
                id: (args as DeletePostMutationVariables).id,
              });
            },
            vote: (_result, args, cache, info) => {
              const { postId, value } = args as VoteMutationVariables;
              const data = cache.readFragment(
                gql`
                  fragment _ on Post {
                    id
                    points
                    voteStatus
                  }
                `,
                { id: postId }
              );
              if (data) {
                const newValue = (data.points as number) + value;
                if (value === data.voteStatus) {
                  return;
                }
                cache.writeFragment(
                  gql`
                    fragment _ on Post {
                      points
                      voteStatus
                    }
                  `,
                  { id: postId, points: newValue, voteStatus: value }
                );
              }
            },

            createPost: (_result, args, cache, info) => {
              invalidatePost(cache)
            },

            Login: (_result, args, cache, info) => {
              betterUpdateQuery<LoginMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.Login.errors) {
                    return query;
                  } else {
                    return {
                      Me: result.Login.user,
                    };
                  }
                }
              );

              invalidatePost(cache)
            },

            register: (_result, args, cache, info) => {
              betterUpdateQuery<RegisterMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.register.errors) {
                    console.log(result.register.errors);
                    return query;
                  } else {
                    return {
                      Me: result.register.user,
                    };
                  }
                }
              );
            },

            Logout: (_result, args, cache, info) => {
              betterUpdateQuery<LogoutMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.Logout) {
                    return {
                      Me: null,
                    };
                  } else {
                    return {
                      Me: null,
                    };
                  }
                }
              );
            },
          },
        },
      }),
      ssrExchange,
      errorExchange,
      fetchExchange,
    ],
  };
};
