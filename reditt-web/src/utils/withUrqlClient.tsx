import {dedupExchange, fetchExchange, ssrExchange } from "urql";
// import { withUrqlClient } from 'next-urql';
import { betterUpdateQuery } from "./betterUpdateQuery";
import { cacheExchange } from "@urql/exchange-graphcache";
import { LoginMutation, LogoutMutation, MeDocument, MeQuery, RegisterMutation } from "../generated/graphql";

export const createUrqlClient = (ssrExchange : any) => ({
   url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include" as const,
  },
  exchanges: [
    dedupExchange,
    cacheExchange({
      updates: {
        Mutation: {
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
          },

          register: (_result, args, cache, info) => {
            betterUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.register.errors) {
                  console.log(result.register.errors)
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
                    Me : null
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
    fetchExchange,
  ],
});
