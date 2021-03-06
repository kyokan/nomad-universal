import {PostType as SubTypes} from "fn-client/lib/application/Post";

export enum PostType {
  ORIGINAL = 'original',
  COMMENT = 'comment',
  LINK = 'link',
  VIDEO = 'video',
}

export type RelayerPostModel = {
  title: string;
  parent: string;
  context: string;
  content: string;
  topic: string;
  tags: string[];
  subtype: SubTypes;
  videoUrl?: string;
  thumbnailUrl?: string;
}
