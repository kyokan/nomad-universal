import {PostType} from "../../types/posts";
import {PostType as SubTypes} from "fn-client/lib/application/Post";

export type DraftPost = {
  subtype: SubTypes;
  type: PostType;
  timestamp: number;
  title: string;
  content: string;
  topic: string;
  tags: string[];
  context: string;
  parent: string;
  attachments: string[];
}

export type DraftPostOpts = {
  subtype?: SubTypes;
  type?: PostType;
  timestamp?: number;
  title?: string;
  content?: string;
  topic?: string;
  tags?: string[];
  attachments?: string[];
  context?: string;
  parent?: string;
}

export const createNewDraft = (draft?: DraftPostOpts): DraftPost => {
  return {
    subtype: '',
    type: PostType.ORIGINAL,
    timestamp: 0,
    title: '',
    content: '',
    topic: '',
    tags: [],
    context: '',
    parent: '',
    attachments: [],
    ...draft || {},
  };
};
