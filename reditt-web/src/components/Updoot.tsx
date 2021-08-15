import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Flex, Box, IconButton } from "@chakra-ui/react";
import React, { useState } from "react";
import { PostFragmentFragment, useVoteMutation } from "../generated/graphql";

interface UpdootProps {
  post: PostFragmentFragment;
}

const Updoot: React.FC<UpdootProps> = ({ post }) => {
  const [LoadingState, setLoadingState] = useState<
    "not-loading" | "updoot-loading" | "downdoot-loading"
  >("not-loading");
  const [, vote] = useVoteMutation();
  return (
    <Flex direction="column" alignItems="center" mr="6">
      <Box>
        <IconButton
          bgColor={post.voteStatus === 1 ? "green.300" : "undefined"}
          aria-label="updoot"
          onClick={async () => {
            if(post.voteStatus === 1){
              return;
            }
            setLoadingState("updoot-loading");
            await vote({
              value: 1,
              postId: post.id,
            });
            setLoadingState("not-loading");
          }}
          isLoading={LoadingState === "updoot-loading"}
          icon={<ChevronUpIcon />}
        />{" "}
      </Box>
      {post.points}
      <Box>
        <IconButton
          bgColor={post.voteStatus === -1 ? "red.300" : "undefined"}
          aria-label="downdoot"
          onClick={async () => {
            if(post.voteStatus === -1){
              return;
            }
            setLoadingState("downdoot-loading");
            await vote({
              value: -1,
              postId: post.id,
            });
            setLoadingState("not-loading");
          }}
          isLoading={LoadingState === "downdoot-loading"}
          icon={<ChevronDownIcon />}
        />{" "}
      </Box>
    </Flex>
  );
};

export default Updoot;
