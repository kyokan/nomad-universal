import React, {ReactElement, useCallback, useState, MouseEvent, MouseEventHandler} from "react";
import {markup} from "../../utils/rte";
import {MenuPortal} from "../Menuable/menu-portal";
import copy from "copy-to-clipboard";
import { withRouter, RouteComponentProps } from "react-router";
import './markup.scss';
import RichTextEditor from "../RichTextEditor";

type Props = {
  content: string;
  html?: string;
  handleOpenDiscuss?: () => void;
  customRenderer?: marked.Renderer;
  onClick?: MouseEventHandler;
} & RouteComponentProps;

function Markup(props: Props): ReactElement {
  const [menu, setMenu] = useState(false);
  const [href, setHref] = useState('');
  const [x, setX] = useState(-1);
  const [y, setY] = useState(-1);
  // const onContextMenuClick = useCallback(e => {
  //   // @ts-ignore
  //   const { tagName, href, dataset } = e.target || {};
  //
  //   if (dataset.href) {
  //     e.stopPropagation();
  //     e.preventDefault();
  //     setMenu(true);
  //     setHref(dataset.href);
  //     setX(e.pageX);
  //     setY(e.pageY);
  //     return;
  //   }
  //
  //   if (tagName === 'A') {
  //     e.stopPropagation();
  //     e.preventDefault();
  //     setMenu(true);
  //     setHref(href);
  //     setX(e.pageX);
  //     setY(e.pageY);
  //     return;
  //   }
  // }, [x, y, menu, href]);


  const menuItems = [
    {
      text: `Copy Link Address`,
      onClick: () => {
        copy(href);
        setMenu(false);
      },
    },
  ];

  const onClick = useCallback(async (e: MouseEvent<HTMLDivElement>) => {
    // @ts-ignore
    const { tagName, href } = e.target;

    if (tagName === 'A') {
      e.stopPropagation();
      e.preventDefault();
      if (props.onClick) {
        props.onClick(href);
      } else if (typeof window !== "undefined") {
        window.open(href, '_blank');
      }
      return;
    }
  }, []);

  return (
    <>
      <div
        className="marked"
        onClick={onClick}
        // onContextMenu={onContextMenuClick}
      >
        {
          (!props.content || !!props.content.trim()) && (
            <RichTextEditor
              content={props.content}
              onChange={() => null}
              readOnly
            />
          )
        }
      </div>
      {
        menu && (
          <MenuPortal
            items={menuItems}
            closeMenu={() => {
              setMenu(false);
            }}
            style={{
              top: `${y - 0}px`,
              left: `${x - 0}px`,
            }}
          />
        )
      }
    </>
  )
}

export default withRouter(Markup);

function _DangerousHTML(props: { html?: string; content: string; customRenderer?: marked.Renderer }): ReactElement {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: props.html || markup(props.content, props.customRenderer),
      }}
    />
  )
}

const DangerousHTML = React.memo(_DangerousHTML);
