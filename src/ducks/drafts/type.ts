import {PostType} from "../../types/posts";
import {PostType as SubTypes} from "fn-client/lib/application/Post";
import {ModerationType} from "fn-client/lib/application/Moderation";

export type DraftPost = {
  subtype: SubTypes;
  moderationType?: ModerationType|null;
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
  moderationType?: ModerationType|null;
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
    moderationType: null,
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
