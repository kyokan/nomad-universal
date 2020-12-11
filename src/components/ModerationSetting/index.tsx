import React, {ReactElement, ReactNode} from "react";
import {RouteComponentProps, withRouter} from "react-router-dom";
import "./moderation-setting.scss";
import {DraftPost} from "../../ducks/drafts/type";
import {RelayerNewPostResponse} from "../../utils/types";
import {useCurrentUsername, useUser} from "../../ducks/users";
import {useBlocklist, useCustomBlocklist, useDefaultBlocklist} from "../../ducks/blocklist";
import Avatar from "../Avatar";
import {parseUsername} from "../../utils/user";
import classNames from "classnames";

type Props = {
  sendPost?: (post: DraftPost) => Promise<RelayerNewPostResponse>
} & RouteComponentProps;

function ModerationSetting(props: Props): ReactElement {
  return (
    <div className="domain-setting">
      <div className="setting__group">
        <div className="setting__group__content">
          {renderBlocklist(props)}
          {renderDefaultBlocklist(props)}
        </div>
      </div>
    </div>
  );
}

export default withRouter(ModerationSetting);

function renderDefaultBlocklist(props: Props): ReactNode {
  const list = useDefaultBlocklist();

  return (
    <div className="setting__group__content__row">
      <div className="setting__group__content__row__label">
        <div>Default Blocklists:</div>
        <div className="setting__group__content__row__label__sub">
          Default blocklists for this site.
        </div>
      </div>
      <div
        className="setting__group__content__row__list"
      >
        { !list.length && 'Empty'}
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

function renderBlocklist(props: Props): ReactNode {
  const list = useCustomBlocklist();

  return (
    <div className="setting__group__content__row">
      <div className="setting__group__content__row__label">
        <div>Your Blocklists:</div>
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
  const {tld} = parseUsername(username);
  const { stats } = user || {};
  const currentUsername = useCurrentUsername();
  const isSelf = currentUsername === username;

  return (
    <div
      className={classNames("user-panel__row", {
        'user-panel__row--self': isSelf,
      })}
      onClick={() => props.history.push(`/users/${username}/blocks`)}
    >
      <Avatar username={username} />
      <div className="user-panel__row__info">
        <div className="user-panel__row__info__name">
          <div className="user-panel__row__info__display-name">
            {isSelf ? `Blocked by you` : `Blocked by @${tld}`}
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
