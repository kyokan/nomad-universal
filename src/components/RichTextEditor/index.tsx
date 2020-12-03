import React, {
  ButtonHTMLAttributes,
  memo,
  MouseEventHandler,
  ReactElement, ReactNode,
  useCallback, useEffect,
  useState
} from 'react';
import {
  convertToRaw,
  DraftHandleValue,
  EditorState,
  RichUtils,
  DefaultDraftBlockRenderMap,
  ContentState,
} from "draft-js";
import Editor from "draft-js-plugins-editor";
import c from "classnames";
import Icon from "../Icon";
import './rich-text-editor.scss';
import {createNewDraft, DraftPost} from "../../ducks/drafts/type";
import {useDraftPost} from "../../ducks/drafts";
import {PostType} from "../../types/posts";
import {customStyleMap, mapDraftToEditorState, markdownConvertOptions} from "../../utils/rte";
import {addLinkPlugin} from "./plugins/addLinkPlugin";
import Input from "../Input";
import {draftToMarkdown} from "markdown-draft-js";
import Menuable from "../Menuable";

const hljs = require('highlight.js');
const TableUtils = require('draft-js-table');

type Props = {
  className?: string;
  content?: string;
  onChange: (post: DraftPost) => void;
  disabled?: boolean;
  embedded?: boolean;
  readOnly?: boolean;
  onSecondaryClick?: MouseEventHandler;
  onPrimaryClick?: MouseEventHandler;
  onFileUpload?: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
  primaryBtnProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}

function RichTextEditor(props: Props): ReactElement {
  const {
    className = '',
    disabled,
    onChange,
    embedded,
    onPrimaryClick,
    onSecondaryClick,
    primaryBtnProps,
    readOnly,
  } = props;

  const [ref, setRef] = useState<Editor|null>(null);
  const [editorState, _setEditorState] = useState<EditorState>(props.content
    ? EditorState.createWithContent(ContentState.createFromText(props.content))
    : EditorState.createEmpty()
  );
  const [title, setTitle] = useState<string>('');

  useEffect(() => {
    (async function() {
      if (readOnly && typeof props.content !== 'undefined') {
        _setEditorState(mapDraftToEditorState(createNewDraft({ content: props.content })))
      }
    })();
  }, [props.content, readOnly]);

  const setEditorState = useCallback((newEditorState: EditorState) => {
    _setEditorState(newEditorState);
    const currentContent = newEditorState.getCurrentContent();
    // const markdown = stateToMarkdown(currentContent, { gfm: true });
    const markdown = draftToMarkdown(convertToRaw(currentContent), markdownConvertOptions);

    onChange({
      type: PostType.ORIGINAL,
      subtype: '',
      timestamp: new Date().getTime(),
      title,
      content: currentContent.hasText() ? markdown : '',
      topic: '',
      context: '',
      parent: '',
      tags: [],
      attachments: [],
    });
  }, [onChange, editorState]);

  const handleKeyCommand: (command: string) => DraftHandleValue = useCallback((command: string): DraftHandleValue => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  }, [editorState]);

  const onBoldClick = useRTEInlineStyleCallback(
    editorState,
    ref,
    'BOLD',
    setEditorState,
    [editorState, ref],
  );

  const onItalicClick = useRTEInlineStyleCallback(
    editorState,
    ref,
    'ITALIC',
    setEditorState,
    [editorState],
  );

  const onUnderlineClick = useRTEInlineStyleCallback(
    editorState,
    ref,
    'UNDERLINE',
    setEditorState,
    [editorState, ref],
  );

  const onStrikethroughClick = useRTEInlineStyleCallback(
    editorState,
    ref,
    'STRIKETHROUGH',
    setEditorState,
    [editorState, ref],
  );

  const onCodeClick = useRTEInlineStyleCallback(
    editorState,
    ref,
    'CODE',
    setEditorState,
    [editorState, ref],
  );

  const [link, onLinkChange] = useState('');
  const [isShowingLinkInput, showLinkInput] = useState(false);

  const onLinkClick = useCallback(() => {
    if (!isShowingLinkInput) {
      showLinkInput(true);
    } else {
      showLinkInput(false);
    }
  }, [editorState, setEditorState, link, isShowingLinkInput]);

  const onAddLink = useCallback((url: string) => {
    const selection = editorState.getSelection();
    if (!url) {
      setEditorState(RichUtils.toggleLink(editorState, selection, null));
      return 'handled';
    }

    const content = editorState.getCurrentContent();
    const contentWithEntity = content.createEntity('LINK', 'MUTABLE', {
      url: url,
    });
    const newEditorState = EditorState.push(editorState, contentWithEntity, 'create-entity' as any);
    const entityKey = contentWithEntity.getLastCreatedEntityKey();

    setEditorState(RichUtils.toggleLink(newEditorState, selection, entityKey));
    showLinkInput(false);
  }, [editorState]);

  const onFileUpload = useCallback(async () => {
    if (!props.onFileUpload) return;
    await props.onFileUpload(async (file, skylink, progress) => {
      const currentContent = editorState.getCurrentContent();
      const markdown = draftToMarkdown(convertToRaw(currentContent), markdownConvertOptions);
      const md = markdown + '\n' + `[${file.name}](${skylink})`;
      const newEditorState = mapDraftToEditorState(createNewDraft({ content: md }));
      setEditorState(newEditorState);
    });
  }, [editorState, props.onFileUpload]);

  const onCodeBlockClick = useRTEInBlockTypeCallback(
    editorState,
    ref,
    'code-block',
    setEditorState,
    [editorState, ref],
  );

  const onOrderedListClick = useRTEInBlockTypeCallback(
    editorState,
    ref,
    'ordered-list-item',
    setEditorState,
    [editorState, ref],
  );

  const onUnorderedListClick = useRTEInBlockTypeCallback(
    editorState,
    ref,
    'unordered-list-item',
    setEditorState,
    [editorState, ref],
  );

  const onBlockquoteClick = useRTEInBlockTypeCallback(
    editorState,
    ref,
    'blockquote',
    setEditorState,
    [editorState, ref],
  );

  return (
    <div
      className={c('rich-text-editor', className, {
        'rich-text-editor--disabled': disabled,
        'rich-text-editor--embedded': embedded,
        'rich-text-editor--readOnly': readOnly,
      })}
    >
      {
        !readOnly && !embedded && (
          <RTEControls
            editorState={editorState}
            onBoldClick={onBoldClick}
            onItalicClick={onItalicClick}
            onUnderlineClick={onUnderlineClick}
            onStrikethroughClick={onStrikethroughClick}
            onCodeClick={onCodeClick}
            onLinkClick={onLinkClick}
            onAddLink={onAddLink}
            showURLInput={showLinkInput}
            isShowingLinkInput={isShowingLinkInput}
            onCodeBlockClick={onCodeBlockClick}
            onOrderedListClick={onOrderedListClick}
            onUnorderedListClick={onUnorderedListClick}
            onBlockquoteClick={onBlockquoteClick}
            onPrimaryClick={onPrimaryClick}
            onSecondaryClick={onSecondaryClick}
            onFileUpload={onFileUpload}
            // embedded={embedded}
            primaryBtnProps={primaryBtnProps}
          />
        )
      }
      <Editor
        ref={setRef}
        editorState={editorState}
        onChange={setEditorState}
        handleKeyCommand={handleKeyCommand}
        customStyleMap={customStyleMap}
        blockRenderMap={DefaultDraftBlockRenderMap.merge(TableUtils.DraftBlockRenderMap)}
        placeholder="Write here..."
        plugins={[
          addLinkPlugin as any,
        ]}
        readOnly={readOnly}
      />
    </div>
  );
}

export default memo(RichTextEditor);

type RTEButtonProps = {
  material: string;
  onClick: MouseEventHandler;
  width?: number;
  active?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

function RTEButton(props: RTEButtonProps): ReactElement {
  return (
    <button
      className={c("rich-text-editor__controls__button", {
        "rich-text-editor__controls__button--active": props.active,
      })}
      onClick={props.disabled ? undefined : props.onClick}
      disabled={props.disabled}
    >
      <Icon
        material={props.material}
        width={props.width}
      />
      {props.children}
    </button>
  )
}

type RETControlsProps = {
  editorState: EditorState;
  onBoldClick: () => void;
  onItalicClick: () => void;
  onUnderlineClick: () => void;
  onStrikethroughClick: () => void;
  onCodeClick: () => void;
  onLinkClick: () => void;
  onAddLink: (url: string) => void;
  showURLInput: (showing: boolean) => void;
  onCodeBlockClick: () => void;
  onOrderedListClick: () => void;
  onUnorderedListClick: () => void;
  onBlockquoteClick: () => void;
  onSecondaryClick?: MouseEventHandler;
  onPrimaryClick?: MouseEventHandler;
  onFileUpload: () => void;
  embedded?: boolean;
  primaryBtnProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  isShowingLinkInput?: boolean;
}

function RTEControls(props: RETControlsProps): ReactElement {
  const {
    onBoldClick,
    onItalicClick,
    onUnderlineClick,
    onStrikethroughClick,
    onLinkClick,
    onAddLink,
    showURLInput,
    onOrderedListClick,
    onUnorderedListClick,
    onBlockquoteClick,
    onSecondaryClick,
    onPrimaryClick,
    embedded,
    primaryBtnProps = {},
    editorState,
    isShowingLinkInput,
    onFileUpload,
  } = props;

  const currentInlineStyle = editorState.getCurrentInlineStyle()?.toJS();
  const selection = editorState.getSelection();
  const hasSelection = selection.getEndOffset() - selection.getStartOffset() > 0;
  const [link, setLink] = useState('');
  const currentType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return (
    <div className="rich-text-editor__controls">
      <RTEButton
        material="format_bold"
        onClick={onBoldClick}
        active={currentInlineStyle.includes('BOLD')}
      />
      <RTEButton
        material="format_italic"
        onClick={onItalicClick}
        active={currentInlineStyle.includes('ITALIC')}
      />
      <RTEButton
        material="format_underline"
        onClick={onUnderlineClick}
        active={currentInlineStyle.includes('UNDERLINE')}
      />
      <RTEButton
        material="format_strikethrough"
        onClick={onStrikethroughClick}
        active={currentInlineStyle.includes('STRIKETHROUGH')}
      />
      <RTEButton
        material="link"
        onClick={onLinkClick}
        active={isShowingLinkInput}
        disabled={!hasSelection}
      >
        {
          isShowingLinkInput &&  (
            <div
              className="rte__link-input"
              onClick={e => e.stopPropagation()}
            >
              <Input
                type="text"
                onChange={e => setLink(e.target.value)}
                value={link}
                autoFocus
              />
              <div className="rte__link-input__actions">
                <Icon
                  material="check"
                  onClick={() => {
                    onAddLink(link);
                    setLink('');
                    showURLInput(false);
                  }}
                />
                <Icon
                  material="cancel"
                  onClick={() => {
                    onAddLink('');
                    setLink('');
                    showURLInput(false);
                  }}
                />
              </div>
            </div>
          )
        }
      </RTEButton>
      <RTEButton
        material="link_off"
        onClick={() => onAddLink('')}
        disabled={!hasSelection}
      />
      <RTEButton
        material="format_list_numbered"
        onClick={onOrderedListClick}
        width={16}
        active={currentType === "ordered-list-item"}
      />
      <RTEButton
        material="format_list_bulleted"
        onClick={onUnorderedListClick}
        width={16}
        active={currentType === "unordered-list-item"}
      />
      <RTEButton
        material="format_quote"
        onClick={onBlockquoteClick}
        width={16}
        active={currentType === "blockquote"}
      />
      <Menuable
        items={[
          {
            text: 'Upload via Sia Skynet',
            onClick: onFileUpload,
          }
        ]}
      >
        <RTEButton
          onClick={() => null}
          material="publish"
          width={16}
        />
      </Menuable>
      {
        embedded && (
          <div className="rich-text-editor__controls__actions">
            <button className="button" onClick={onSecondaryClick}>Cancel</button>
            <button
              {...primaryBtnProps}
              className={`button ${primaryBtnProps.className}`}
              onClick={onPrimaryClick}
            >
              Send
            </button>
          </div>
        )
      }
    </div>
  );
}

function useRTEInlineStyleCallback(
  editorState: EditorState,
  editor: Editor|null,
  cmd: string,
  cb?: (s: EditorState) => void,
  dep?: any[],
): () => void {
  return useCallback(() => {
    const newState = RichUtils.toggleInlineStyle(editorState, cmd);
    if (cb) cb(newState);
    if (editor) setTimeout(editor.focus, 0);
  }, dep || []);
}

function useRTEInBlockTypeCallback(
  editorState: EditorState,
  editor: Editor|null,
  cmd: string,
  cb?: (s: EditorState) => void,
  dep?: any[],
): () => void {
  return useCallback(() => {
    const newState = RichUtils.toggleBlockType(editorState, cmd);
    if (cb) cb(newState);
    if (editor) setTimeout(editor.focus, 0);
  }, dep || []);
}
