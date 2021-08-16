import DataLoader from "dataloader";
import { Updoot } from "../entities/Updoot";

export const createUpdootLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Updoot | null>(
    async (keys) => {
      const updoots = await Updoot.findByIds(keys as any);
      const updootsmap: Record<string, Updoot> = {};
      updoots.forEach((u) => {
        updootsmap[`${u.postId}|${u.userId}`] = u;
      });
      return keys.map((k) => updootsmap[`${k.postId}|${k.userId}`]);
    }
  );
