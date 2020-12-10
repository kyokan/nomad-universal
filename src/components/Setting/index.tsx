import React, {ReactElement, ReactNode} from "react";
import {withRouter, RouteComponentProps, Switch, Route, Redirect} from "react-router-dom";
import ProfileSetting from "../ProfileSetting";
import DomainSetting from "../DomainSetting";
import "./settings.scss";
import classNames from "classnames";
import {DraftPost} from "../../ducks/drafts/type";
import {RelayerNewPostResponse} from "../../utils/types";
import ModerationSetting from "../ModerationSetting";

type Props = {
  onSendPost: (draft: DraftPost, truncate?: boolean) => Promise<RelayerNewPostResponse>;
  onFileUpload: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
} & RouteComponentProps;

function Settings (props: Props): ReactElement {
  return (
    <div className="settings">
      {renderNav(props)}
      {renderContent(props)}
    </div>
  )
}

export default withRouter(Settings);

function renderNav(props: RouteComponentProps): ReactNode {
  return (
    <div className="settings__nav">
      <div
        className={classNames("settings__nav__row", {
          "settings__nav__row--active": "/settings/domain" === props.location.pathname,
        })}
        onClick={() => props.history.push('/settings/domain')}
      >
        Domain
      </div>
      <div
        className={classNames("settings__nav__row", {
          "settings__nav__row--active": "/settings/profile" === props.location.pathname,
        })}
        onClick={() => props.history.push('/settings/profile')}
      >
        Profile
      </div>
      <div
        className={classNames("settings__nav__row", {
          "settings__nav__row--active": "/settings/moderation" === props.location.pathname,
        })}
        onClick={() => props.history.push('/settings/moderation')}
      >
        Moderation
      </div>
    </div>
  )
}

function renderContent(props: Props): ReactNode {
  return (
    <div className="settings__content">
      <Switch>
        <Route path="/settings/profile">
          <ProfileSetting
            sendPost={props.onSendPost}
            onFileUpload={props.onFileUpload}
          />
        </Route>
        <Route path="/settings/domain">
          <DomainSetting />
        </Route>
        <Route path="/settings/moderation">
          <ModerationSetting />
        </Route>
        <Route>
          <Redirect to="/settings/domain" />
        </Route>
      </Switch>
    </div>
  )
}
