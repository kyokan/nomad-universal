import React, {MouseEvent, MouseEventHandler, ReactElement, ReactNode, useCallback, useState} from "react";
import Menuable, {MenuProps} from "../Menuable";
import {RouteComponentProps, withRouter} from "react-router";
import Avatar from "../Avatar";
import {parseUsername} from "../../utils/user";
import {useCurrentUsername, useIdentities, useUser} from "../../ducks/users";
import Button from "../Button";
import Icon from "../Icon";
import classNames from "classnames";
import "./user-menu.scss"

type Props = {
  login?: MouseEventHandler | boolean;
  signup?: MouseEventHandler | boolean;
  signupText?: string;
  multiAccount?: boolean;
  onLogout?: () => void;
  onSetting?: () => void;
  onDownloadKeystore?: () => void;
} & RouteComponentProps;

export default withRouter(UserMenu);
function UserMenu(props: Props): ReactElement {
  const currentUsername = useCurrentUsername();
  const onLogout = () => null;
  const identities = useIdentities();

  if (!identities.length && !currentUsername) {
    return renderNoKnownUsers(props);
  } else if (identities.length && !currentUsername) {
    return renderUnauthenticatedKnownUsers(
      props,
      identities,
    );
  }

  return (
    <Menuable
      className={classNames("account-circle", {

      })}
      items={[
        {
          forceRender: (closeModal) => renderMainAccount(
            props,
            currentUsername,
            true,
            closeModal,
            onLogout,
          ),
        },
        {divider: true,},
        ...identities
          .filter(username => username !== currentUsername)
          .map(username => ({
            forceRender: () => renderSwitchAccount(props, username),
          })),
        props.multiAccount ? {forceRender: () => renderAddAnother(props)} : null,
        props.multiAccount ? {divider: true} : null,
        props.onDownloadKeystore
          ? {
            text: 'Download Keystore',
            onClick: props.onDownloadKeystore,
          }
          : null,
        props.onSetting
          ? {
            text: 'Settings',
            onClick: props.onSetting,
          }
          : null,
      ]}
    >
      <Avatar username={currentUsername} />
    </Menuable>
  )
}


function renderMainAccount(props: Props, username: string, isLoggedIn: boolean, closeModal?: () => void, onLogout?: () => void): ReactNode {
  const { tld, subdomain } = parseUsername(username);
  const user = useUser(username);

  return (
    <div
      className="main-account"
      onClick={() => props.history.push(`/users/${username}/timeline`)}
    >
      <Avatar username={username} />
      <div className="main-account__info">
        {renderUserStatus(props, username)}
        <div className="main-account__info__display-name">
          { user?.displayName || subdomain || tld }
        </div>
        <div className="main-account__info__username">
          {`@${username}`}
        </div>
      </div>
      <Button
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          if (isLoggedIn) {
            onLogout && onLogout();
          } else {
            props.history.push(`/login/${username}`);
          }
          closeModal && closeModal();
        }}
      >
        { isLoggedIn ? `Logout @${username}` : `Login @${username}` }
      </Button>
    </div>
  )
}

function renderUserStatus(props: Props, username: string): ReactNode {
  const user = useUser(username);

  if (user?.confirmed) {
    return <></>;
  }

  return (
    <div className={classNames("main-account__status", {
      "main-account__status--pending": user?.registered && !user?.confirmed,
      "main-account__status--not-registered": !user?.registered,
    })}>
      {user?.registered ? 'Pending Confirmation' : 'Not Registered'}
    </div>
  )
}

function renderSwitchAccount(props: Props, username: string): ReactNode {
  const { tld, subdomain } = parseUsername(username);
  const user = useUser(username);

  return (
    <div
      className="switch-account"
      onClick={() => props.history.push(`/login/${username}`)}
    >
      <Avatar username={username} />
      <div className="switch-account__info">
        <div className="switch-account__info__display-name">
          { user?.displayName || subdomain || tld }
        </div>
        <div className="switch-account__info__username">
          {`@${username}`}
        </div>
      </div>
    </div>
  )
}

function renderAddAnother(props: Props): ReactNode {
  return (
    <div className="add-account" onClick={() => props.history.push('/signup')}>
      <Icon material="person_add" width={18} />
      <div className="add-account__info">
        Add another domain name
      </div>
    </div>
  )
}

function renderNoKnownUsers(props: Props) {
  return props.signup
    ? (
      <Button
        className="header-button"
        onClick={(e) => {
          if (typeof props.signup === "function") {
            props.signup(e);
          } else {
            props.history.push('/signup');
          }
        }}
      >
        {props.signupText || 'Sign Up'}
      </Button>
    )
    : <></>;
}

function renderUnauthenticatedKnownUsers(props: Props, identities: string[]) {
  return (
    <Menuable
      className="account-circle account-circle--unauth"
      items={[
        ...identities.map(username => ({
          forceRender: () => renderSwitchAccount(props, username),
        })),
        {divider: true,},
        props.multiAccount ? {forceRender: () => renderAddAnother(props)} : null,
        props.multiAccount ? {divider: true} : null,
        props.onDownloadKeystore
          ? {
            text: 'Download Keystore',
            onClick: props.onDownloadKeystore,
          }
          : null,
        props.onSetting
          ? {
            text: 'Settings',
            onClick: props.onSetting,
          }
          : null,
      ]}
    >
      <Icon material="login" width={28} />
    </Menuable>
  );
}


