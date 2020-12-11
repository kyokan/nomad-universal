import React, {ReactElement, ReactNode} from "react";
import {RouteComponentProps, withRouter} from "react-router-dom";
import copy from "copy-to-clipboard";
import "./moderation-setting.scss";
import Button from "../Button";
import {DraftPost} from "../../ducks/drafts/type";
import {RelayerNewPostResponse} from "../../utils/types";
import {useCurrentUser, useCurrentUsername, useUser} from "../../ducks/users";
import c = require("classnames");
import {useBlocklist} from "../../ducks/blocklist";
import Avatar from "../Avatar";
import UserCard from "../UserCard";
import {parseUsername} from "../../utils/user";

type Props = {
  sendPost?: (post: DraftPost) => Promise<RelayerNewPostResponse>
} & RouteComponentProps;

function ModerationSetting(props: Props): ReactElement {
  return (
    <div className="domain-setting">
      <div className="setting__group">
        <div className="setting__group__content">
          {renderBlocklist(props)}
        </div>
      </div>
    </div>
  );
}

export default withRouter(ModerationSetting);

function renderBlocklist(props: Props): ReactNode {
  const list = useBlocklist();

  return (
    <div className="setting__group__content__row">
      <div className="setting__group__content__row__label">
        <div>Global Blocklist:</div>
        <div className="setting__group__content__row__label__sub">
          Posts and replies from blocked domains will not show up on your feeds.
        </div>
      </div>
      <div
        className="setting__group__content__row__list"
      >
        {list.map(tld => (
          <UserBlockRow
            key={tld}
            username={tld}
          />
        ))}
      </div>
    </div>
  )
}

export const UserBlockRow = withRouter(_UserBlockRow);
function _UserBlockRow(props: {username: string} & RouteComponentProps): ReactElement {
  const username = props.username;
  const user = useUser(username);
  const {tld, subdomain} = parseUsername(username);
  const { displayName, stats } = user || {};

  return (
    <div
      className="user-panel__row"
      onClick={() => props.history.push(`/users/${username}/blocks`)}
    >
      <Avatar username={username} />
      <div className="user-panel__row__info">
        <div className="user-panel__row__info__name">
          <div className="user-panel__row__info__display-name">
            Blocked by @{tld}
          </div>
        </div>
        <div className="user-panel__row__info__stats">
          <div className="user-panel__row__info__stats__number">
            {stats?.blockings || 0}
          </div>
          <div className="user-panel__row__info__stats__unit">
            domain(s)
          </div>
        </div>
      </div>
    </div>
  );
}
