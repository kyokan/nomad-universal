export enum PostType {
  ORIGINAL = 'original',
  COMMENT = 'comment',
}

export type RelayerPostModel = {
  title: string;
  parent: string;
  context: string;
  content: string;
  topic: string;
  tags: string[];
}
