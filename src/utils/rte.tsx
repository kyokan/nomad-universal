import React from "react";
import marked from "marked";
import {CompositeDecorator, convertFromRaw, EditorState} from "draft-js";
import * as DOMPurify from "dompurify";
import {hash} from "./hash";
import Anchor from "../components/Anchor";
import {DraftPost} from "../ducks/drafts/type";

const { markdownToDraft } = require('markdown-draft-js');
const hljs = require('highlight.js');

const renderer = new marked.Renderer({
  pedantic: false,
  gfm: true,
  breaks: true,
  sanitize: true,
  smartLists: false,
  smartypants: false,
  xhtml: false,
});


renderer.link = (href: string, title: string, text: string, level = 0): string => {
  try {
    const {protocol} = new URL(href);
    const url = href.replace(`${protocol}//`, '');
    const linkText = url.length > 48
      ? url.slice(0, 48) + '...'
      : url;

    const displayText = text === href
      ? linkText
      : text || linkText;

    let replacedHref = href;

    switch (protocol) {
      case 'sia:':
        replacedHref = href.replace('sia://', 'https://siasky.net/');
        break;
      default:
        break;
    }
    return `<a href="${replacedHref}" title="${text}" target="_blank">${displayText}</a>`;
  } catch (e) {
    //
    return '';
  }
};

renderer.image = (href: string, title: string, text: string, level = 0): string => {
  try {
    const {protocol} = new URL(href);

    const url = href.replace(`${protocol}//`, '');
    const linkText = url.length > 48
      ? url.slice(0, 48) + '...'
      : url;

    return `<a href="${href}" title="${text || href}" target="_blank">${linkText}</a>`
  } catch (e) {
    //
    return '';
  }
};

const MARKUP_CACHE: {
  [contentHash: string]: string;
} = {};

renderer.html = function (html: string): string {
  const contentHash = hash(html, '');

  if (MARKUP_CACHE[contentHash]) {
    return MARKUP_CACHE[contentHash];
  }

  try {
    const parser = new DOMParser();
    const dom = parser.parseFromString(html, 'text/html');
    const returnHTML = Array.prototype.map
      .call(dom.body.childNodes, el => {
        return el.dataset.imageFileHash
          ? el.outerHTML
          : el.innerText;
      })
      .join('');

    MARKUP_CACHE[contentHash] = returnHTML;
    return returnHTML;
  } catch (e) {
    return '';
  }

};

export function markup(content: string, customRenderer?: marked.Renderer): string {
  try {
    let html = '';

    if (content) {
      const contentHash = hash(content, '');

      if (MARKUP_CACHE[contentHash]) {
        html = MARKUP_CACHE[contentHash];
      } else {
        const dirty = marked(content, {
          renderer: customRenderer || renderer,
          breaks: true,
          pedantic: false,
          gfm: true,
          sanitize: true,
          smartLists: false,
          smartypants: false,
          xhtml: false,
          highlight: function (str: string, lang: string) {
            if (lang && hljs.getLanguage(lang)) {
              try {
                return hljs.highlight(lang, str).value;
              } catch (err) {
                //
              }
            }

            try {
              return hljs.highlightAuto(str).value;
            } catch (err) {
              //
            }

            return ''; // use external default escaping
          }
        });

        html = DOMPurify.sanitize(dirty);
        MARKUP_CACHE[contentHash] = html;
      }
    }

    return html;
  } catch (e) {
    return content;
  }

}

export const customStyleMap = {
  CODE: {
    backgroundColor: '#f6f6f6',
    color: '#1c1e21',
    padding: '2px 4px',
    margin: '0 2px',
    borderRadius: '2px',
    fontFamily: 'Roboto Mono, monospace',
  },
};

export const decorator = new CompositeDecorator([
  {
    strategy: findLinkEntities,
    component: (props: any) => {
      const {url} = props.contentState.getEntity(props.entityKey).getData();
      return (
        <Anchor href={url}>{props.children}</Anchor>
      );
    },
  },
]);

function findLinkEntities(contentBlock: any, callback: any, contentState: any) {
  contentBlock.findEntityRanges(
    (character: any) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'LINK'
      );
    },
    callback
  );
}

export const mapDraftToEditorState = (draft?: DraftPost): EditorState => {
  if (!draft) {
    return EditorState.createEmpty(decorator);
  }

  // return EditorState.createWithContent(
  //   stateFromMarkdown(draft.content),
  //   decorator,
  // );
  return EditorState.createWithContent(
    convertFromRaw(markdownToDraft(draft.content, markdownConvertOptions)),
    decorator,
  );
};

export const markdownConvertOptions = {
  preserveNewlines: true,
  blockStyles: {
    'ins_open': 'UNDERLINE',
    'del_open': 'STRIKETHROUGH',
  },
  styleItems: {
    'UNDERLINE': {
      open: function () {
        return '++';
      },

      close: function () {
        return '++';
      }
    },
    'STRIKETHROUGH': {
      open: function () {
        return '~~';
      },

      close: function () {
        return '~~';
      }
    },
  },
  remarkableOptions: {
    html: false,
    xhtmlOut: false,
    breaks: true,
    enable: {
      inline: ["ins", 'del'],
      core: ['abbr']
    },

    highlight: function (str: string, lang: string) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(lang, str).value;
        } catch (err) {
          //
        }
      }

      try {
        return hljs.highlightAuto(str).value;
      } catch (err) {
        //
      }

      return ''; // use external default escaping
    }
  }
};
