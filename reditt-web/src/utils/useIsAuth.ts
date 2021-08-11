import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMeQuery } from "../generated/graphql";

export const useIsAuth = (nextPage : string) => {
  const [{ data, fetching }] = useMeQuery();
  const router = useRouter();
  useEffect(() => {
    if (!fetching && !data?.Me?.id) {
      router.replace("/login?next=/"+nextPage);
    }
  }, [data, router, fetching]);
};
