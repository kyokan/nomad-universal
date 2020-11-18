import React, {ReactElement, useCallback, useState} from "react";
import {withRouter, RouteComponentProps, Redirect} from "react-router";
import c from 'classnames';
import {parseUsername, RELAYER_TLDS} from "../../utils/user";
import Icon from "../Icon";
import Input from "../Input";
import {OnboardingViewType} from "./index";
import Button from "../Button";

type PasswordLoginProps = {
  onNext: () => void;
} & RouteComponentProps;

function Welcome(props: PasswordLoginProps): ReactElement {
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      props.onNext();
    }
  }, [props.onNext]);

  return (
    <div className="onboarding">
      <div className="onboarding__panel">
        <div className="onboarding__panel__title">
          {`Welcome to Nomad ✌️`}
        </div>
        <div className="onboarding__panel__subtitle">
          Nomad is a peer-to-peer, ownerless social network built on top of Handshake and Footnote. It allows you to view and interact with content from owners of Handshake names.
        </div>
        <div className="onboarding__panel__footer">
          <Button
            onClick={props.onNext}
          >
            Next
          </Button>
        </div>
      </div>

    </div>
  );
}

export default withRouter(Welcome);
