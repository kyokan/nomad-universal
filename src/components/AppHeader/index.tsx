import React, {ReactElement, ReactNode, useCallback, MouseEvent, MouseEventHandler} from "react";
import {RouteComponentProps, withRouter, Switch, Route} from "react-router-dom";
import "./app-header.scss";
import {useDispatch} from "react-redux";
import Icon from "../Icon";
import {useCurrentUsername, useUser, useIdentities, setCurrentUser} from "../../ducks/users";
import Button from "../Button";
import Avatar from "../Avatar";
import Menuable from "../Menuable";
import {parseUsername} from "../../utils/user";
import classNames = require("classnames");

type Props = {
  logoUrl: string;
  login?: MouseEventHandler | boolean;
  signup?: MouseEventHandler | boolean;
  signupText?: string;
  multiAccount?: boolean;
  onLogout?: () => void;
  onSetting?: () => void;
  onDownloadKeystore?: () => void;
  onCompose?: () => void;
} & RouteComponentProps;
function AppHeader(props: Props): ReactElement {
  return (
    <div className="app-header">
      <div className="app-header__content">
        <div className="app-header__content__l">
          {renderLeft(props)}
        </div>
        {renderRight(props)}
      </div>
    </div>
  );
}

export default withRouter(AppHeader);

function renderLeft(props: Props): ReactNode {
  return (
    <Switch>
      <Route path="/posts/:postHash">
        <Back />
      </Route>
      <Route path="/directory">
        <Back />
        <div className="app-header__title">Domain Directory</div>
      </Route>
      <Route path="/search">
        <Back />
      </Route>
      <Route path="/write">
        <Back />
        <div className="app-header__title">Write a post</div>
      </Route>
      <Route path="/users/:username/:viewType?">
        <UserHeader />
      </Route>
      <Route>
        <Icon className="app-logo" url={props.logoUrl} width={28} />
      </Route>
    </Switch>
  )
}

const Back = withRouter(_Back);
function _Back(props: RouteComponentProps): ReactElement {
  return (
    <Icon
      className="app-header__content__l__back"
      material="keyboard_backspace"
      onClick={() => {
        if (props.history.length > 1) {
          props.history.goBack();
        } else {
          props.history.push('/home');
        }
      }}
      width={28}
    />
  )
}

const UserHeader = withRouter(_UserHeader);
function _UserHeader(props: RouteComponentProps<{username: string}>): ReactElement {
  const username = props.match.params.username;
  const { tld, subdomain } = parseUsername(username);
  const user = useUser(username);

  return (
    <div className="user-header__wrapper">
      <Icon
        className="app-header__content__l__back"
        material="keyboard_backspace"
        onClick={() => {
          if (props.history.length > 1) {
            props.history.goBack();
          } else {
            props.history.push('/home');
          }
        }}
        width={28}
      />
      <div
        className="user-header"
        onClick={() => props.history.push(`/users/${username}/timeline`)}
      >
        <div className="user-header__info">
          <div className="user-header__info__name">
            <div className="user-header__info__display-name">
              {user?.displayName || subdomain || tld}
            </div>
            <div className="user-header__info__username">
              {`@${username}`}
            </div>
          </div>
          <div className="user-header__info__stats">
            <div className="user-header__info__stats__number">
              {user?.stats?.followings || 0}
            </div>
            <div className="user-header__info__stats__unit">Following</div>
            <div className="user-header__info__stats__divider" />
            <div className="user-header__info__stats__number">
              {user?.stats?.followers || 0}
            </div>
            <div className="user-header__info__stats__unit">Followers</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderRight(props: Props): ReactNode {
  const dispatch = useDispatch();

  const onCreate = useCallback(() => {
    props.history.push(`/write`);
  }, []);

  const onLogout = useCallback(async () => {
    props.onLogout && props.onLogout();
    dispatch(setCurrentUser(''));
  }, [dispatch]);

  const identities = useIdentities();

  const currentUsername = useCurrentUsername();
  const user = useUser(currentUsername);

  if (!identities.length && !currentUsername) {
    return renderNoKnownUsers(props);
  } else if (identities.length && !currentUsername) {
    return renderUnauthenticatedKnownUsers(
      props,
      identities,
    );
  }

  return (
    <div className="app-header__content__r">
      <Icon
        material="home"
        width={28}
        onClick={() => props.history.push('/home')}
      />
      <Icon
        material="public"
        width={28}
        onClick={() => props.history.push('/discover')}
      />
      <Icon
        material="edit"
        width={28}
        onClick={props.onCompose ? props.onCompose : onCreate}
        disabled={!user?.confirmed}
      />
      <Menuable
        className="app-header__content__r__account-circle"
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
    </div>
  );
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
  return (
    <div className="app-header__content__r">
      <Icon
        material="public"
        width={28}
        onClick={() => props.history.push('/discover')}
      />
      {/*<Icon*/}
      {/*  material="settings"*/}
      {/*  width={28}*/}
      {/*  onClick={onSetting}*/}
      {/*/>*/}
      {
        props.login && (
          <Button
            className="header-button"
            onClick={(e) => {
              if (typeof props.login === "function") {
                props.login(e);
              } else {
                props.history.push('/login');
              }
            }}
          >
            Login
          </Button>
        )
      }
      {
        props.signup && (
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
      }
    </div>
  );
}

function renderUnauthenticatedKnownUsers(props: Props, identities: string[]) {
  return (
    <div className="app-header__content__r">
      <Icon
        material="public"
        width={28}
        onClick={() => props.history.push('/discover')}
      />
      <Icon
        material="edit"
        width={28}
        onClick={() => undefined}
        disabled
      />
      <Menuable
        className="app-header__content__r__account-circle app-header__content__r__account-circle--unauth"
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
    </div>
  );
}
